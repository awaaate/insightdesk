import { z, type ZodType } from "zod";

/**
 * Namespace containing event bus functionality for type-safe pub/sub events
 */
export namespace Bus {
  /** Type representing an event definition created by {@link event} */
  export type EventDefinition = ReturnType<typeof event>;
  /** Type representing an event subscription callback */
  export type Subscription = (event: any) => void;

  /** Map storing event subscriptions by event type */
  const subscriptions = new Map<any, Subscription[]>();
  /** Registry of event definitions by type */
  const registry = new Map<string, EventDefinition>();

  /* Create an event type  name */

  /**
   * Creates a strongly-typed event definition
   * @param type - The unique event type identifier
   * @param properties - Zod schema defining the event properties
   * @returns Event definition object
   */
  export function event<Type extends string, Properties extends ZodType>(
    type: Type,
    properties: Properties
  ) {
    const result = {
      type,
      properties,
    };
    registry.set(type, result);
    return result;
  }

  /**
   * Creates a Zod schema for validating event payloads
   * @returns Zod discriminated union of all registered event types
   */
  export function payloads() {
    return z.discriminatedUnion(
      "type",
      registry
        .entries()
        .map(([type, def]) =>
          z.object({
            type: z.literal(type),
            properties: def.properties,
          })
        )
        .toArray() as any
    );
  }

  /**
   * Publishes an event to all subscribers
   * @param def - Event definition object
   * @param properties - Event properties matching the definition schema
   * @returns Promise that resolves when all subscribers have processed the event
   */
  export async function publish<Definition extends EventDefinition>(
    def: Definition,
    properties: z.output<Definition["properties"]>
  ) {
    const payload = {
      type: def.type,
      properties,
    };
    const pending = [];
    for (const key of [def.type, "*"]) {
      const match = subscriptions.get(key);
      for (const sub of match ?? []) {
        pending.push(sub(payload));
      }
    }
    return Promise.all(pending);
  }

  /**
   * Subscribes to events of a specific type
   * @param def - Event definition to subscribe to
   * @param callback - Function called when matching events are published
   * @returns Unsubscribe function
   */
  export function subscribe<Definition extends EventDefinition>(
    def: Definition,
    callback: (event: {
      type: Definition["type"];
      properties: z.infer<Definition["properties"]>;
    }) => void
  ) {
    return raw(def.type, callback);
  }

  /**
   * Subscribes to a single occurrence of an event
   * @param def - Event definition to subscribe to
   * @param callback - Function called when event occurs. Return "done" to auto-unsubscribe
   */
  export function once<Definition extends EventDefinition>(
    def: Definition,
    callback: (event: {
      type: Definition["type"];
      properties: z.infer<Definition["properties"]>;
    }) => "done" | undefined
  ) {
    const unsub = subscribe(def, (event) => {
      if (callback(event)) unsub();
    });
  }

  /**
   * Subscribes to all events regardless of type
   * @param callback - Function called for every published event
   * @returns Unsubscribe function
   */
  export function subscribeAll(callback: (event: any) => void) {
    return raw("*", callback);
  }

  /**
   * Internal helper for managing subscriptions
   * @param type - Event type to subscribe to
   * @param callback - Subscription callback function
   * @returns Unsubscribe function
   */
  function raw(type: string, callback: (event: any) => void) {
    let match = subscriptions.get(type) ?? [];
    match.push(callback);
    subscriptions.set(type, match);

    return () => {
      const match = subscriptions.get(type);
      if (!match) return;
      const index = match.indexOf(callback);
      if (index === -1) return;
      match.splice(index, 1);
    };
  }
}
