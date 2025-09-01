import { uniqueBy } from "remeda";
import { DB } from "@/db";
import { sql } from "drizzle-orm";

export const insightsDb = [
  {
    "ID insight": "0",
    Operativa: "No insight",
    Insight: "No insight",
    BU: "Sin equipo",
  },
  {
    "ID insight": "2",
    Operativa: "Atención al cliente",
    Insight:
      "No se puede agendar una cita presencial desde la app, lo que dificulta gestiones en oficina.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "3",
    Operativa: "Atención al cliente",
    Insight:
      "El contacto con un agente por chat o teléfono es lento o poco accesible.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "4",
    Operativa: "UX",
    Insight: "La interfaz resulta confusa y poco intuitiva",
    BU: "UX/UI",
  },
  {
    "ID insight": "5",
    Operativa: "Atención al cliente",
    Insight:
      "En oficina se redirige a los clientes imagin a llamar, sin ofrecer atención directa.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "6",
    Operativa: "Préstamos",
    Insight:
      "Hay trabas para acceder a préstamos, incluso con historial o nómina domiciliada.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "7",
    Operativa: "UX",
    Insight:
      "Falta una versión web, lo que restringe el acceso desde otros dispositivos.",
    BU: "UX/UI",
  },
  {
    "ID insight": "8",
    Operativa: "Seguros",
    Insight:
      "No se puede consultar fácilmente la información de seguros contratados.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "10",
    Operativa: "Publicidad",
    Insight: "La app muestra publicidad excesiva o percibida como poco clara.",
    BU: "UX/UI",
  },
  {
    "ID insight": "11",
    Operativa: "Notificaciones",
    Insight:
      "No se puede acceder fácilmente a las notificaciones dentro de la app.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "15",
    Operativa: "Performance",
    Insight: "La aplicación se cierra sola o no abre, dificultando su uso.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "16",
    Operativa: "Bizum",
    Insight:
      "Bizum presenta fallos de funcionamiento que impiden su uso normal.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "19",
    Operativa: "Cuenta corriente",
    Insight:
      "Los movimientos no muestran suficiente detalle para ser identificados fácilmente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "20",
    Operativa: "Cuenta corriente",
    Insight:
      "En caso de bloqueo de cuenta, no se informa del motivo ni de los pasos a seguir.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "22",
    Operativa: "Notificaciones",
    Insight:
      "Las notificaciones llegan con demora o directamente no se reciben.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "26",
    Operativa: "Performance",
    Insight: "Es necesario reinstalar la app para corregir errores frecuentes.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "27",
    Operativa: "Gina",
    Insight: "No se recibe respuesta a las consultas enviadas por WhatsApp.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "28",
    Operativa: "Documentos",
    Insight:
      "No es posible firmar, modificar ni descargar documentos desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "30",
    Operativa: "Gina",
    Insight: "Gina no comprende las consultas ni ofrece soluciones útiles.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "31",
    Operativa: "Login",
    Insight:
      "Al iniciar sesión, se solicita la clave varias veces por una incidencia.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "32",
    Operativa: "Compra online",
    Insight:
      "Las autorizaciones de pago tardan en llegar o son difíciles de acceder.",
    BU: "BU Payments",
  },
  {
    "ID insight": "34",
    Operativa: "Login Teens",
    Insight: "Los usuarios Teens no pueden acceder a su cuenta desde la app",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "35",
    Operativa: "Comisiones",
    Insight: "Se cobran comisiones sin que se explique el motivo.",
    BU: "Sin equipo",
  },
  {
    "ID insight": "36",
    Operativa: "Transferencias",
    Insight: "No se pueden realizar transferencias inmediatas desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "37",
    Operativa: "Préstamos",
    Insight:
      "No se permite acceder a ampliación de crédito ni opciones de financiación como Facilitea.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "42",
    Operativa: "Tarjetas",
    Insight: "No se ofrece una tarjeta de débito desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "44",
    Operativa: "Transferencias",
    Insight: "Las transferencias tardan en llegar más de lo esperado.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "45",
    Operativa: "Transferencias",
    Insight:
      "No se puede generar justificante de transferencias internacionales, ni ver detalles o guardar cuentas frecuentes.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "46",
    Operativa: "Incidencias",
    Insight: "Una incidencia impide modificar la contraseña desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "47",
    Operativa: "UX",
    Insight: "Cuesta encontrar justificantes o descargarlos correctamente.",
    BU: "UX/UI",
  },
  {
    "ID insight": "48",
    Operativa: "Transferencias",
    Insight:
      "Se presentan errores o fallos al intentar realizar transferencias.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "50",
    Operativa: "Transferencias",
    Insight:
      "No se informa sobre los límites diarios, semanales o mensuales para transferencias.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "53",
    Operativa: "CaixaBank Now",
    Insight:
      "No hay compatibilidad entre la app de imagin y la de CaixaBank Now.",
    BU: "Sin equipo",
  },
  {
    "ID insight": "54",
    Operativa: "Captación",
    Insight:
      "El alta por app es difícil de completar; el proceso no es intuitivo y suele requerir llamar o acudir a una oficina.",
    BU: "BU Growth",
  },
  {
    "ID insight": "56",
    Operativa: "Préstamos",
    Insight: "Percepción de intereses elevados en los préstamos.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "57",
    Operativa: "Compra online",
    Insight:
      "Ocurren fallos al autorizar compras online: se reinicia la app o hay que repetir la operación.",
    BU: "BU Payments",
  },
  {
    "ID insight": "58",
    Operativa: "Login",
    Insight:
      "El acceso con huella dactilar presenta errores o no funciona correctamente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "59",
    Operativa: "Recibos",
    Insight: "No se pueden descargar los recibos desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "63",
    Operativa: "Bizum",
    Insight:
      "Las notificaciones de Bizum no muestran información suficiente como origen, concepto o importe.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "65",
    Operativa: "Seguridad",
    Insight:
      "La configuración de contraseña es limitada y no permite incluir caracteres especiales.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "67",
    Operativa: "Documentos",
    Insight: "No se puede solicitar el certificado de saldo desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "68",
    Operativa: "Campaña captación",
    Insight:
      "Se presentan problemas o incidencias en la campaña de domiciliación de nómina.",
    BU: "BU Growth",
  },
  {
    "ID insight": "69",
    Operativa: "Préstamos",
    Insight:
      "Falta información clara sobre condiciones de los préstamos, como intereses, plazos o amortización.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "71",
    Operativa: "Tarjetas",
    Insight:
      "En caso de rechazo o bloqueo de tarjeta, no se informa del motivo ni de los pasos a seguir.",
    BU: "BU Payments",
  },
  {
    "ID insight": "72",
    Operativa: "Transferencias",
    Insight: "No se pueden realizar transferencias internacionales (NO SEPA).",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "76",
    Operativa: "Login",
    Insight:
      "El acceso mediante FaceID presenta errores o no funciona correctamente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "78",
    Operativa: "UX",
    Insight:
      "Clientes con productos en CaixaBank no pueden operarlos desde imagin y la consulta disponible es limitada.",
    BU: "UX/UI",
  },
  {
    "ID insight": "82",
    Operativa: "Transferencias",
    Insight:
      "Los justificantes de transferencias muestran información insuficiente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "84",
    Operativa: "Transferencias",
    Insight:
      "No está disponible la funcionalidad de retrocesión para transferencias emitidas o recibidas.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "85",
    Operativa: "UX",
    Insight:
      "Es difícil acceder, visualizar y entender los productos contratados desde la app.",
    BU: "UX/UI",
  },
  {
    "ID insight": "86",
    Operativa: "UX",
    Insight:
      "Cuesta encontrar la opción para activar o cancelar una tarjeta dentro de la app.",
    BU: "UX/UI",
  },
  {
    "ID insight": "87",
    Operativa: "Atención al cliente",
    Insight:
      "La atención de los gestores del Contact Center es percibida como poco resolutiva.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "88",
    Operativa: "Recibos",
    Insight:
      "Es difícil encontrar el detalle de los recibos y no se detectan correctamente para poder devolverlos.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "89",
    Operativa: "Documentos",
    Insight:
      "Hay dificultades para descargar certificados de titularidad desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "90",
    Operativa: "Ventajas no financieras",
    Insight:
      "Las ventajas no financieras no se aprovechan porque no se conocen o fallan al solicitarlas.",
    BU: "BU Engagement",
  },
  {
    "ID insight": "92",
    Operativa: "Huchas",
    Insight:
      "Existen dudas sobre cómo funciona la sección de Retos, incluyendo creación y retiro de dinero.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "103",
    Operativa: "Login",
    Insight:
      "No se puede recuperar el acceso si no se tiene móvil actualizado o tarjeta activa.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "104",
    Operativa: "Login",
    Insight: "Clientes sin SAU no pueden generarlo sin acudir a una oficina.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "106",
    Operativa: "Bizum",
    Insight: "No se puede retroceder un Bizum enviado por error.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "107",
    Operativa: "Captación Teens",
    Insight:
      "No es posible tramitar un alta Teens de forma completamente online.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "108",
    Operativa: "Tarjetas",
    Insight:
      "Falta información clara sobre el Carnet Joven, como renovación, vencimiento o solicitud.",
    BU: "BU Payments",
  },
  {
    "ID insight": "109",
    Operativa: "Compra online",
    Insight: "No se puede retroceder un pago realizado online.",
    BU: "BU Payments",
  },
  {
    "ID insight": "110",
    Operativa: "Datos cliente",
    Insight:
      "No se puede modificar el número de móvil si no se tiene acceso al anterior o no está registrado.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "117",
    Operativa: "Captación",
    Insight:
      "Clientes nuevos no pueden ver el estado de su alta ni el tiempo estimado de aprobación.",
    BU: "BU Growth",
  },
  {
    "ID insight": "121",
    Operativa: "Nómina",
    Insight:
      "No está disponible la opción de solicitar un anticipo de nómina desde la app.",
    BU: "BU Growth",
  },
  {
    "ID insight": "123",
    Operativa: "Préstamos",
    Insight: "No se informa del motivo al denegar un préstamo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "124",
    Operativa: "Préstamos",
    Insight:
      "No está disponible la opción para solicitar la devolución de cobros indebidos de préstamos.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "125",
    Operativa: "Cuenta corriente",
    Insight:
      "Se registran abonos retenidos en cuenta sin información clara sobre su liberación.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "129",
    Operativa: "Cuenta corriente",
    Insight:
      "No se permite tener un importe descubierto en cuenta según perfil, lo que limita la operativa.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "130",
    Operativa: "Seguros",
    Insight:
      "No se puede solicitar la devolución de cobros indebidos relacionados con seguros.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "132",
    Operativa: "Performance",
    Insight:
      "La app no es compatible con ciertos modelos de móviles como iPhone 6, Huawei o Pixel 7a.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "133",
    Operativa: "Seguros",
    Insight:
      "Falta información en la app sobre cómo dar de baja un seguro contratado.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "134",
    Operativa: "Préstamos",
    Insight:
      "La funcionalidad de amortización total o parcial del préstamo es poco visible.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "136",
    Operativa: "Notificaciones",
    Insight:
      "Las notificaciones no se activan o se desactivan solas sin acción del usuario.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "140",
    Operativa: "Login",
    Insight:
      "En el login no se aclara que el usuario es el DNI, lo que genera confusión y llamadas innecesarias.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "143",
    Operativa: "Tarjeta Reload",
    Insight:
      "No aparece la opción para solicitar la tarjeta Reload desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "145",
    Operativa: "Cuenta corriente",
    Insight:
      "No se informa claramente el estado del proceso de baja ni si se ha tramitado correctamente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "146",
    Operativa: "Tarjetas",
    Insight:
      "No se entiende el funcionamiento de la tarjeta MyCard ni se distingue entre compras y costes de financiación.",
    BU: "BU Payments",
  },
  {
    "ID insight": "149",
    Operativa: "Préstamos",
    Insight:
      "Los agentes del Contact Center no pueden agendar citas con gestores o el Sales Hub para resolver dudas sobre préstamos.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "151",
    Operativa: "Préstamos",
    Insight:
      "No se informa claramente del saldo pendiente por liquidar en los préstamos, lo que genera confusión con los cobros mensuales.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "154",
    Operativa: "Transferencias",
    Insight:
      "Los detalles de transferencias recibidas o enviadas son insuficientes (ej. nombre del titular).",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "156",
    Operativa: "Hipoteca",
    Insight:
      "En solicitudes de hipoteca no se informa del estado ni de los pasos a seguir.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "158",
    Operativa: "Transferencias",
    Insight:
      "Existe una limitación en las transferencias internacionales (SEPA) a importes menores de 1.000 €.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "159",
    Operativa: "Compra online",
    Insight:
      "Si la app está abierta al autorizar una compra, la notificación no aparece y obliga a reiniciarla.",
    BU: "BU Payments",
  },
  {
    "ID insight": "162",
    Operativa: "Tarjetas",
    Insight:
      "Las tarjetas se bloquean por incoherencias de titularidad, generando confusión en los clientes.",
    BU: "BU Payments",
  },
  {
    "ID insight": "163",
    Operativa: "Teens",
    Insight:
      "Los menores no pueden realizar solicitudes o peticiones desde la app, aunque sean validadas por su representante legal.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "165",
    Operativa: "Kids",
    Insight:
      "No se puede tramitar el alta de usuarios Kids de forma completamente online.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "166",
    Operativa: "Hipoteca",
    Insight:
      "No hay un espacio centralizado en la app con información clara sobre las hipotecas disponibles.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "169",
    Operativa: "Tarjetas",
    Insight:
      "Se producen errores al intentar activar una tarjeta desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "173",
    Operativa: "Inversión",
    Insight:
      "La información sobre opciones de ahorro está dispersa y no se presenta de forma unificada.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "177",
    Operativa: "Tarjetas",
    Insight:
      "No se comprende cómo funciona ni cómo se liquida la tarjeta, ni se diferencia entre compras y costes de financiación.",
    BU: "BU Payments",
  },
  {
    "ID insight": "178",
    Operativa: "Cuenta corriente",
    Insight: "No se permite abrir una cuenta multititular desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "182",
    Operativa: "Inversión",
    Insight:
      "La información sobre los fondos de inversión contratados es limitada o poco detallada.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "183",
    Operativa: "Tarjetas",
    Insight: "No se informa del motivo al denegar una tarjeta de crédito.",
    BU: "BU Payments",
  },
  {
    "ID insight": "185",
    Operativa: "Captación",
    Insight:
      "Durante el alta como cliente aparecen errores que impiden continuar y no se indica cómo resolverlos.",
    BU: "BU Growth",
  },
  {
    "ID insight": "186",
    Operativa: "Login",
    Insight:
      "No se orienta al usuario sobre cómo realizar correctamente la foto del DNI o el vídeo durante el alta.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "187",
    Operativa: "Préstamos",
    Insight:
      "Al solicitar un préstamo no se informa sobre los pasos a seguir, el estado de la solicitud ni el tiempo estimado de respuesta.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "189",
    Operativa: "Préstamos",
    Insight:
      "No se permite modificar la fecha de cobro de las cuotas de préstamos.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "190",
    Operativa: "Divisa",
    Insight:
      "No se puede solicitar divisa extranjera ni reservar cita para gestionarlo desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "192",
    Operativa: "UX",
    Insight: "El saldo de la cuenta no aparece en la pantalla inicial.",
    BU: "UX/UI",
  },
  {
    "ID insight": "194",
    Operativa: "Tarjetas",
    Insight: "Error al intentar contratar una tarjeta por la app",
    BU: "BU Payments",
  },
  {
    "ID insight": "197",
    Operativa: "Seguros",
    Insight:
      "El cliente no recibe información sobre el estado del proceso de baja de un seguro.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "202",
    Operativa: "Cajero",
    Insight: "Falla la opción de retirar dinero con código en cajeros.",
    BU: "CaixaBank",
  },
  {
    "ID insight": "204",
    Operativa: "Inversión",
    Insight: "Falla la operativa con fondos e inversiones desde la app.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "207",
    Operativa: "Bizum",
    Insight: "Las gestiones con Bizum son lentas.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "208",
    Operativa: "Cuenta corriente",
    Insight: "No se puede completar el proceso de baja de cuenta online.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "210",
    Operativa: "Tarjetas",
    Insight:
      "Los límites de crédito disponibles en las tarjetas son muy bajos.",
    BU: "BU Payments",
  },
  {
    "ID insight": "211",
    Operativa: "UX",
    Insight: "La app no es compatible con iPad o tablets.",
    BU: "UX/UI",
  },
  {
    "ID insight": "212",
    Operativa: "Pago móvil",
    Insight: "Se presentan errores al utilizar el pago móvil.",
    BU: "BU Payments",
  },
  {
    "ID insight": "214",
    Operativa: "Login",
    Insight: "Usuarios nuevos no pueden acceder a la app después del alta.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "215",
    Operativa: "Login",
    Insight: "El flujo de recuperación de claves no funciona correctamente.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "216",
    Operativa: "Tarjetas",
    Insight:
      "Falta un apartado con información sobre productos y condiciones al viajar al extranjero",
    BU: "BU Payments",
  },
  {
    "ID insight": "217",
    Operativa: "Tarjetas",
    Insight: "No se puede modificar el límite de las tarjetas desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "225",
    Operativa: "Login",
    Insight:
      "La app aparece como no disponible o se detiene al intentar acceder.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "227",
    Operativa: "UX",
    Insight:
      "No existe una opción para ocultar el saldo al acceder a la app (modo discreto).",
    BU: "UX/UI",
  },
  {
    "ID insight": "229",
    Operativa: "Atención al cliente",
    Insight:
      "No se obtiene respuesta al llamar; las llamadas se cuelgan o hay largas esperas",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "230",
    Operativa: "UX",
    Insight:
      "Al finalizar una transacción no se muestra un resumen con los detalles básicos.",
    BU: "UX/UI",
  },
  {
    "ID insight": "231",
    Operativa: "Performance",
    Insight: "El escaneo de documentos no funciona correctamente.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "232",
    Operativa: "UX",
    Insight: "Hay dificultades para configurar el idioma en la app.",
    BU: "UX/UI",
  },
  {
    "ID insight": "234",
    Operativa: "Captación",
    Insight:
      "Al introducir el DNI o NIE durante el alta, se presentan errores.",
    BU: "BU Growth",
  },
  {
    "ID insight": "236",
    Operativa: "Tarjetas",
    Insight:
      "No está claro el proceso a seguir en caso de robo o fraude con tarjeta.",
    BU: "BU Payments",
  },
  {
    "ID insight": "237",
    Operativa: "Atención al cliente",
    Insight:
      "No hay opción para contactar con un gestor por chat o teléfono desde la app.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "243",
    Operativa: "Tarjetas",
    Insight:
      "No se puede liquidar la tarjeta de crédito en el momento deseado; solo en fechas preestablecidas.",
    BU: "BU Payments",
  },
  {
    "ID insight": "244",
    Operativa: "Login",
    Insight:
      "El acceso a la app falla sin mostrar mensajes de error o explicación.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "245",
    Operativa: "Transferencias",
    Insight:
      "No se informa del tiempo estimado que tardará una transferencia al realizarla.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "247",
    Operativa: "Publicidad",
    Insight: "La publicidad resulta intrusiva y retrasa la navegación.",
    BU: "UX/UI",
  },
  {
    "ID insight": "249",
    Operativa: "Gina",
    Insight: "Gina presenta errores que impiden enviar mensajes.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "250",
    Operativa: "Teens",
    Insight:
      "Falta información sobre la transición de ImaginTeens a Imagin al cumplir la mayoría de edad.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "251",
    Operativa: "UX",
    Insight: "Falta información clara sobre las condiciones de los productos.",
    BU: "UX/UI",
  },
  {
    "ID insight": "254",
    Operativa: "Tarjetas",
    Insight:
      "No se muestra el estado ni el plazo estimado al solicitar una tarjeta.",
    BU: "BU Payments",
  },
  {
    "ID insight": "256",
    Operativa: "UX",
    Insight: "Es difícil encontrar el IBAN dentro de la app.",
    BU: "UX/UI",
  },
  {
    "ID insight": "259",
    Operativa: "Tarjeta Reload",
    Insight:
      "Se ha empezado a cobrar por recarga en la tarjeta Reload sin previo aviso.",
    BU: "BU Payments",
  },
  {
    "ID insight": "262",
    Operativa: "Inversión",
    Insight: "La funcionalidad de acciones es limitada o incompleta.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "264",
    Operativa: "Bizum",
    Insight: "El buscador de contactos no funciona en la operativa de Bizum.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "267",
    Operativa: "Login",
    Insight:
      "La app se bloquea al iniciar sesión con datos correctos y obliga a cambiar la contraseña.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "270",
    Operativa: "Recibos",
    Insight: "Se genera un error al intentar domiciliar recibos.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "276",
    Operativa: "Gina",
    Insight:
      "Gina redirige a las FAQs en lugar de responder directamente a las consultas.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "277",
    Operativa: "Bizum",
    Insight: "Se produce un error al intentar registrarse en Bizum.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "278",
    Operativa: "UX",
    Insight: "No se puede cambiar entre modo claro y modo oscuro en la app",
    BU: "UX/UI",
  },
  {
    "ID insight": "279",
    Operativa: "Transferencias",
    Insight: "Da error al modificar o cancelar transferencias planificadas.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "280",
    Operativa: "MyMonz",
    Insight:
      "Las gráficas de ingresos y gastos han desaparecido en las nuevas versiones de la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "285",
    Operativa: "UX",
    Insight:
      "La app presenta un exceso de funcionalidades que complica la navegación.",
    BU: "UX/UI",
  },
  {
    "ID insight": "286",
    Operativa: "Préstamos",
    Insight:
      "Se promocionan préstamos a usuarios que luego no pueden acceder a ellos.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "288",
    Operativa: "Tarjetas",
    Insight: "La tarjeta física tarda en llegar o no llega.",
    BU: "BU Payments",
  },
  {
    "ID insight": "289",
    Operativa: "Tarjetas",
    Insight: "Se presentan errores al pagar con tarjeta digital.",
    BU: "BU Payments",
  },
  {
    "ID insight": "295",
    Operativa: "Tarjetas",
    Insight: "No se puede recargar la tarjeta desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "298",
    Operativa: "Huchas",
    Insight: "Se produce un error al intentar crear una hucha digital.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "301",
    Operativa: "Huchas",
    Insight: "No siempre se puede retirar dinero de un reto cuando se desea.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "302",
    Operativa: "Transferencias",
    Insight:
      "No se informa de la hora en la que se ejecutan las transferencias.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "305",
    Operativa: "Inversión",
    Insight: "La app se cierra al intentar acceder al apartado de inversiones.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "306",
    Operativa: "Captación",
    Insight:
      "Al dar de alta un producto no se genera automáticamente el SAU ni se entregan las claves de acceso.",
    BU: "BU Growth",
  },
  {
    "ID insight": "309",
    Operativa: "Seguros",
    Insight:
      "No se puede solicitar la baja de un seguro por la app ni hay información sobre cómo hacerlo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "310",
    Operativa: "Tarjetas teens",
    Insight:
      "El flujo para contratar tarjetas Reload para Teens es complejo y no se puede hacer desde Now.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "312",
    Operativa: "Hipoteca",
    Insight:
      "Falta información sobre la hipoteca contratada, como condiciones o cuadro de amortización.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "313",
    Operativa: "Préstamos",
    Insight:
      "La app ofrece poca información y FAQs sobre los préstamos disponibles.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "315",
    Operativa: "Tarjetas",
    Insight:
      "La opción para solicitar devoluciones o reembolsos no está visible de forma clara.",
    BU: "BU Payments",
  },
  {
    "ID insight": "317",
    Operativa: "Tarjetas",
    Insight:
      "No se indica el estado de la solicitud al pedir una devolución o reembolso.",
    BU: "BU Payments",
  },
  {
    "ID insight": "320",
    Operativa: "Préstamos",
    Insight:
      "El importe mínimo exigido para solicitar un préstamo es demasiado alto.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "325",
    Operativa: "Teens",
    Insight:
      "No se publican los pasos a seguir para tramitar el alta de un usuario Teens.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "326",
    Operativa: "Cuenta corriente",
    Insight:
      "La contratación de una segunda cuenta desde la app no es fácil ni intuitiva.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "329",
    Operativa: "Compra online",
    Insight: "Autorizar una compra tarda mucho o se queda cargando en bucle.",
    BU: "BU Payments",
  },
  {
    "ID insight": "330",
    Operativa: "Tarjetas",
    Insight: "No se puede dar de alta la tarjeta digital desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "331",
    Operativa: "Atención al cliente",
    Insight:
      "No todos los trámites se pueden hacer de forma remota, a pesar de ser un banco digital.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "332",
    Operativa: "Notificaciones",
    Insight: "Los contratos firmados vuelven a aparecer como pendientes.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "333",
    Operativa: "Gina",
    Insight:
      "El chat de Gina no funciona; la pantalla queda en blanco al intentar contactar.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "334",
    Operativa: "Documentos",
    Insight: "Exportar documentos o detalles desde la app resulta complicado.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "335",
    Operativa: "Pago móvil",
    Insight: "Error al intentar activar el pago móvil desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "338",
    Operativa: "Performance",
    Insight:
      "La app muestra un mensaje de error de conexión a internet sin que haya problemas de red.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "340",
    Operativa: "Captación",
    Insight:
      "Los agentes tienen dificultades o desconocimiento al dar de alta cuentas con NIE.",
    BU: "BU Growth",
  },
  {
    "ID insight": "342",
    Operativa: "Captación",
    Insight:
      "Durante el alta, al introducir la nacionalidad se genera un error o se cierra la app.",
    BU: "BU Growth",
  },
  {
    "ID insight": "343",
    Operativa: "Login",
    Insight: "No se puede pegar la contraseña al iniciar sesión.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "344",
    Operativa: "Transferencias",
    Insight: "Error que impide configurar transferencias periódicas.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "347",
    Operativa: "Datos cliente",
    Insight: "La cuenta se bloquea al actualizar el KYC desde la app",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "348",
    Operativa: "Datos cliente",
    Insight: "Se presentan problemas al actualizar el DNI desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "353",
    Operativa: "Nómina",
    Insight: "Hay dificultades al intentar domiciliar la nómina.",
    BU: "BU Growth",
  },
  {
    "ID insight": "354",
    Operativa: "Préstamos",
    Insight: "Se producen errores al intentar solicitar un préstamo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "356",
    Operativa: "Cuenta corriente",
    Insight:
      "No se puede acceder a los movimientos antiguos de la cuenta desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "357",
    Operativa: "Atención al cliente",
    Insight: "La atención en oficina es percibida como poco resolutiva.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "361",
    Operativa: "Comisiones",
    Insight: "Se cobran comisiones muy altas por operaciones en el extranjero.",
    BU: "Sin equipo",
  },
  {
    "ID insight": "362",
    Operativa: "Datos cliente",
    Insight:
      "Al actualizar datos personales, no se guardan los cambios o aparece un error.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "365",
    Operativa: "Préstamos",
    Insight:
      "La opción de amortización total aparece en la app, pero no funciona.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "367",
    Operativa: "Tarjetas",
    Insight: "La tarjeta se bloquea o da de baja sin motivo aparente.",
    BU: "BU Payments",
  },
  {
    "ID insight": "369",
    Operativa: "Tarjetas",
    Insight: "La app se cierra sola al intentar fraccionar un pago.",
    BU: "BU Payments",
  },
  {
    "ID insight": "373",
    Operativa: "Login",
    Insight:
      "Los usuarios que viven en el extranjero no pueden acceder a la app al no recibir el código de acceso.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "374",
    Operativa: "Tarjetas teens",
    Insight:
      "Los representantes legales no reciben información clara sobre los límites de los menores ni son notificados al alcanzarlos.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "376",
    Operativa: "Gina",
    Insight:
      "No se encuentra información clara sobre cómo abrir una cuenta multititular al consultar con Gina.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "378",
    Operativa: "Inversión",
    Insight: "Falta orientación o ayuda al operar con productos de inversión.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "380",
    Operativa: "Tarjetas",
    Insight:
      "El detalle de liquidación de la tarjeta de crédito es confuso o no está actualizado.",
    BU: "BU Payments",
  },
  {
    "ID insight": "381",
    Operativa: "Login",
    Insight: "No se puede acceder a la app tras cambiar la contraseña.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "382",
    Operativa: "Préstamos",
    Insight:
      "Se producen errores al subir documentación para solicitar un préstamo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "385",
    Operativa: "Captación",
    Insight:
      "No se puede abrir una cuenta utilizando pasaporte como documento de identidad.",
    BU: "BU Growth",
  },
  {
    "ID insight": "386",
    Operativa: "Login",
    Insight: "Se produce un error al intentar recuperar la contraseña.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "387",
    Operativa: "Cuenta corriente",
    Insight:
      "Dar de alta una cuenta multititular es complejo o poco intuitivo.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "388",
    Operativa: "Notificaciones",
    Insight:
      "No se pueden configurar notificaciones para ingresos o gastos menores a 30 €.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "389",
    Operativa: "Cajero",
    Insight:
      "Los cajeros presentan fallos frecuentes y no permiten realizar operaciones.",
    BU: "CaixaBank",
  },
  {
    "ID insight": "390",
    Operativa: "Recibos",
    Insight: "La app no permite pagar recibos ni impuestos.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "391",
    Operativa: "Captación",
    Insight:
      "Clientes compartidos tienen dificultades para darse de alta en imagin (CXB Sign).",
    BU: "BU Growth",
  },
  {
    "ID insight": "392",
    Operativa: "Tarjetas",
    Insight:
      "No se entiende la diferencia entre una compra autorizada y una confirmada al solicitar una devolución.",
    BU: "BU Payments",
  },
  {
    "ID insight": "394",
    Operativa: "Préstamos",
    Insight:
      "No hay opción clara en la app para unificar deudas o solicitar una ampliación de préstamo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "395",
    Operativa: "Campaña captación",
    Insight:
      "Hay dudas sobre los términos y condiciones de la campaña de nómina.",
    BU: "BU Growth",
  },
  {
    "ID insight": "397",
    Operativa: "Paypal",
    Insight: "La app no es compatible con PayPal.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "398",
    Operativa: "Datos cliente",
    Insight: "Surgen dudas al actualizar datos o subir documentos KYC.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "403",
    Operativa: "Atención al cliente",
    Insight:
      "Los agentes no informan correctamente sobre las condiciones del producto.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "404",
    Operativa: "Hipoteca",
    Insight:
      "Es difícil contactar con el gestor asignado por canales como chat, muro o correo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "409",
    Operativa: "Captación",
    Insight:
      "Clientes antiguos no pueden darse de alta nuevamente desde la app.",
    BU: "BU Growth",
  },
  {
    "ID insight": "412",
    Operativa: "Tarjetas",
    Insight:
      "La opción para ver el PIN de la tarjeta no está claramente visible.",
    BU: "BU Payments",
  },
  {
    "ID insight": "414",
    Operativa: "Teens",
    Insight: "No está disponible la opción de usar Bizum para usuarios Teens.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "416",
    Operativa: "Pago móvil",
    Insight: "El cliente no sabe cómo activar el pago móvil.",
    BU: "BU Payments",
  },
  {
    "ID insight": "417",
    Operativa: "Seguridad",
    Insight: "El cliente no sabe cómo actuar frente a un caso de phishing.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "418",
    Operativa: "Notificaciones",
    Insight: "Las notificaciones son poco claras y se repiten con frecuencia.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "420",
    Operativa: "Login",
    Insight:
      "Los clientes con SAU bloqueado por inactividad no pueden reactivarlo sin ir a oficina.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "421",
    Operativa: "Login",
    Insight: "El acceso se bloquea tras error u olvido de contraseña.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "423",
    Operativa: "Performance",
    Insight:
      "Tras actualizar la app, se presentan errores al abrirla o se pierden funcionalidades.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "424",
    Operativa: "Cuenta corriente",
    Insight:
      "No se pueden consultar ni descargar los últimos movimientos de la cuenta.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "425",
    Operativa: "Seguridad",
    Insight:
      "Se reciben SMS de confirmación desde un número sospechoso o fraudulento.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "426",
    Operativa: "Tarjetas",
    Insight:
      "No se puede solicitar duplicado de tarjeta por deterioro o pérdida desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "427",
    Operativa: "Pago de recibos/impuestos",
    Insight:
      "No se pueden pagar impuestos, facturas, multas o recibos desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "429",
    Operativa: "Performance",
    Insight:
      "El circuito de operaciones para confirmar códigos es percibido como lento o engorroso.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "435",
    Operativa: "Bizum",
    Insight:
      "No conocen el proceso para cambiar el número de teléfono asociado a Bizum",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "436",
    Operativa: "Transferencias",
    Insight:
      "Antes de realizar una transferencia no se informa sobre las comisiones aplicadas.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "438",
    Operativa: "Cuenta corriente",
    Insight:
      "El cliente quiere acceder a cuentas o depósitos remunerados desde Imagin, pero no están disponibles.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "439",
    Operativa: "Login",
    Insight: "Hay problemas al instalar la app en un segundo dispositivo.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "441",
    Operativa: "Compra online",
    Insight:
      "Falla la autorización de compras online tras la última actualización.",
    BU: "BU Payments",
  },
  {
    "ID insight": "443",
    Operativa: "Huchas",
    Insight: "No se visualiza el monto ahorrado en la funcionalidad de Huchas.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "447",
    Operativa: "Seguridad",
    Insight:
      "Las tarjetas se consideran poco seguras; se filtran con facilidad.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "448",
    Operativa: "Atención al cliente",
    Insight:
      "El cliente solicita la posibilidad de contar con un gestor para realizar gestiones.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "449",
    Operativa: "Tarjetas",
    Insight: "Se cobran comisiones por fraccionamientos a partir de dos meses.",
    BU: "BU Payments",
  },
  {
    "ID insight": "450",
    Operativa: "Nómina",
    Insight:
      "La nómina no se ha recibido en cuenta y el cliente desconoce el motivo.",
    BU: "BU Growth",
  },
  {
    "ID insight": "453",
    Operativa: "Performance",
    Insight:
      "La app no se configura correctamente en un móvil nuevo; se reinicia o no abre.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "456",
    Operativa: "Campaña captación",
    Insight:
      "Hay dudas sobre las condiciones de la campaña MGM: plazos de pago, si quedó activa, etc.",
    BU: "BU Growth",
  },
  {
    "ID insight": "457",
    Operativa: "Teens",
    Insight:
      "El representante legal no aparece vinculado a la cuenta o figura incorrectamente.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "459",
    Operativa: "Tarjetas",
    Insight: "La tarjeta desaparece del Wallet sin motivo aparente.",
    BU: "BU Payments",
  },
  {
    "ID insight": "462",
    Operativa: "Performance",
    Insight: "La app funciona de forma lenta o con bajo rendimiento.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "464",
    Operativa: "Tarjetas",
    Insight:
      "No se puede cancelar una tarjeta desde la app; requiere ir a oficina.",
    BU: "BU Payments",
  },
  {
    "ID insight": "465",
    Operativa: "Cuenta corriente",
    Insight:
      "No se puede realizar un ingreso porque la app indica que se supera el límite permitido.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "466",
    Operativa: "Cuenta corriente",
    Insight:
      "No se puede dar de baja a un titular de cuenta multititular sin eliminar la cuenta completa.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "467",
    Operativa: "Tarjetas",
    Insight: "No se puede bloquear o desbloquear la tarjeta desde la app",
    BU: "BU Payments",
  },
  {
    "ID insight": "469",
    Operativa: "Performance",
    Insight:
      "La app muestra un mensaje indicando que el móvil está rooteado, aunque no lo está.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "471",
    Operativa: "Performance",
    Insight:
      "La app indica que debe actualizarse, aunque no hay una versión nueva disponible.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "474",
    Operativa: "Transferencias",
    Insight:
      "No existe la opción de volver a enviar una transferencia realizada o a contactos frecuentes.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "475",
    Operativa: "Performance",
    Insight:
      "La app deja de funcionar y muestra mensajes de error poco comprensibles.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "477",
    Operativa: "Huchas",
    Insight:
      "Al no poder retirar dinero de una hucha, no se informa el motivo ni cómo proceder.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "478",
    Operativa: "Préstamos",
    Insight:
      "No se puede modificar el importe del préstamo antes de firmarlo sin tener que cancelarlo.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "479",
    Operativa: "Seguros",
    Insight:
      "No se informa la fecha del primer cobro del seguro, lo que genera dudas y llamadas",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "481",
    Operativa: "Performance",
    Insight: "El widget de iOS ha desaparecido tras la última actualización.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "482",
    Operativa: "Teens",
    Insight:
      "Al cumplir 18 años, la app no actualiza correctamente el perfil a usuario adulto.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "487",
    Operativa: "Tarjetas",
    Insight:
      "Se reciben SMS por operaciones denegadas con tarjetas que ya fueron dadas de baja.",
    BU: "BU Payments",
  },
  {
    "ID insight": "488",
    Operativa: "Préstamos",
    Insight:
      "No se puede cancelar desde la app una solicitud de préstamo iniciada en oficina.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "489",
    Operativa: "Tarjetas",
    Insight:
      "No se informa del motivo cuando una operación con tarjeta es denegada.",
    BU: "BU Payments",
  },
  {
    "ID insight": "490",
    Operativa: "Transferencias",
    Insight: "Error que impide realizar transferencias internacionales (SEPA).",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "491",
    Operativa: "Tarjetas",
    Insight: "Se reduce el límite de la tarjeta sin explicación al cliente.",
    BU: "BU Payments",
  },
  {
    "ID insight": "493",
    Operativa: "Bizum",
    Insight: "Al seleccionar un contacto, el dinero se envía a otro distinto.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "494",
    Operativa: "Bizum",
    Insight: "Dudas sobre cómo activar Bizum para usuarios Teens.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "495",
    Operativa: "Cuenta corriente",
    Insight:
      "El cliente no encuentra cómo abrir una cuenta multititular desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "496",
    Operativa: "Captación",
    Insight: "No se puede abrir una cuenta de autónomos desde la app.",
    BU: "BU Growth",
  },
  {
    "ID insight": "497",
    Operativa: "Cuenta corriente",
    Insight:
      "No encuentran fácilmente el motivo o entidad que ha retenido saldo en su cuenta.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "498",
    Operativa: "Cuenta corriente",
    Insight:
      "No hay información clara sobre las características de las cuentas multititulares.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "499",
    Operativa: "Login",
    Insight:
      "No se puede acceder a la app por no tener tarjeta física ni recordar usuario o contraseña.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "501",
    Operativa: "Facilitea",
    Insight:
      "No se entiende cómo funciona la financiación de productos en Facilitea.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "504",
    Operativa: "Performance",
    Insight:
      "La app falla o no funciona correctamente, sin detalles específicos.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "507",
    Operativa: "Cuenta corriente",
    Insight:
      "La cuenta fue eliminada dos veces sin que se explicara el motivo.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "508",
    Operativa: "Performance",
    Insight: "Incidencia generalizada impide el acceso a la app.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "509",
    Operativa: "Atención al cliente",
    Insight:
      "Se percibe mala atención al cliente, sin especificar canal (CC u oficinas).",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "510",
    Operativa: "Captación",
    Insight:
      "No se puede completar el alta digital por ser jurisdicción de riesgo; se requiere ir a oficina.",
    BU: "BU Growth",
  },
  {
    "ID insight": "511",
    Operativa: "Captación Teens",
    Insight:
      "Hay dudas sobre el alta Teens según si los representantes legales son o no clientes de CaixaBank.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "512",
    Operativa: "Captación",
    Insight:
      "El cliente no sabe si puede darse de alta sin tener el DNI o NIE físico, solo el resguardo del trámite.",
    BU: "BU Growth",
  },
  {
    "ID insight": "513",
    Operativa: "Atención al cliente",
    Insight: "No se pueden anular ni modificar citas en oficinas desde la app.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "514",
    Operativa: "Login",
    Insight: "El acceso a la app se bloquea por motivos de seguridad.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "515",
    Operativa: "Hipoteca",
    Insight: "No hay información clara sobre los avales ICO para hipotecas.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "516",
    Operativa: "Datos cliente",
    Insight:
      "No se puede consultar el estado de validación de los documentos aportados para el KYC.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "520",
    Operativa: "Performance",
    Insight: "Crashes: la aplicación se cierra al hacer bizum",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "521",
    Operativa: "Performance",
    Insight:
      "Crashes: la aplicación se cierra al acceder a los movimientos de cuenta/ bucle",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "522",
    Operativa: "Performance",
    Insight: "Crashes: la aplicación se cierra en la operativa transferencias",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "523",
    Operativa: "Pago móvil",
    Insight:
      "Error al intentar añadir una tarjeta a Apple Pay o Android Wallet.",
    BU: "BU Payments",
  },
  {
    "ID insight": "525",
    Operativa: "Performance",
    Insight: "Problemas para activar iSign (nuevo sistema de firma).",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "531",
    Operativa: "Tarjetas",
    Insight: "No se puede consultar ni liquidar deudas vencidas desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "532",
    Operativa: "Captación",
    Insight:
      "No queda claro cuándo falta documentación para completar el alta.",
    BU: "BU Growth",
  },
  {
    "ID insight": "533",
    Operativa: "Tarjetas",
    Insight:
      "Se cobran comisiones de 40 € por retrasos en el pago sin explicaciones previas.",
    BU: "BU Payments",
  },
  {
    "ID insight": "534",
    Operativa: "Documentos",
    Insight: "No se puede descargar el certificado de balance de la cuenta.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "536",
    Operativa: "Atención al cliente",
    Insight:
      "No se puede solicitar cambio de oficina al mudarse a otra ciudad.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "538",
    Operativa: "Datos cliente",
    Insight: "No se puede actualizar el documento de identidad de NIE a DNI.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "543",
    Operativa: "Tarjetas",
    Insight:
      "No se puede ampliar el crédito ni modificar los límites desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "544",
    Operativa: "Hipoteca",
    Insight:
      "Se presentan trabas para acceder a una hipoteca, incluso si el cliente ya tiene historial.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "546",
    Operativa: "Seguros",
    Insight:
      "No se puede consultar el estado de pólizas, ni visualizar recibos pendientes en la app.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "548",
    Operativa: "Tarjetas",
    Insight:
      "No se puede cambiar la cuenta asociada a una tarjeta de débito desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "550",
    Operativa: "Atención al cliente",
    Insight: "El cliente no puede consultar el estado de su reclamación.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "551",
    Operativa: "Performance",
    Insight: "Crashes: aplicación se congela al actualizar documentación ",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "555",
    Operativa: "UX",
    Insight:
      "La experiencia de uso en Bizum es deficiente: los errores no se muestran hasta que la operación ya fue enviada.",
    BU: "UX/UI",
  },
  {
    "ID insight": "556",
    Operativa: "Tarjetas",
    Insight: "No aparece la ubicación física en los pagos con tarjeta.",
    BU: "BU Payments",
  },
  {
    "ID insight": "557",
    Operativa: "UX",
    Insight: "La app deja de funcionar si no se actualiza a la última versión.",
    BU: "UX/UI",
  },
  {
    "ID insight": "558",
    Operativa: "Gina",
    Insight:
      "El historial del chat con Gina no se guarda; al salir, se pierde el contexto de la conversación.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "559",
    Operativa: "Transferencias",
    Insight:
      "El botón para hacer transferencias ha desaparecido tras la última actualización.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "561",
    Operativa: "Recibos",
    Insight: "No se puede volver a pagar un recibo devuelto desde la app.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "565",
    Operativa: "Tarjetas",
    Insight:
      "Falta información clara sobre cómo funciona el fraccionamiento de tarjetas.",
    BU: "BU Payments",
  },
  {
    "ID insight": "567",
    Operativa: "Cuenta corriente",
    Insight:
      "No se informa al cliente que su cuenta está limitada por falta de documentación actualizada (KYC).",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "569",
    Operativa: "Performance",
    Insight:
      "La campaña de iSign aparece como pantalla inicial y no se puede cerrar.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "570",
    Operativa: "Performance",
    Insight: "Crashes: aplicación se cierra en la operativa hipotecas",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "571",
    Operativa: "UX",
    Insight:
      "No se puede personalizar el nombre visible o la apariencia general de la app.",
    BU: "UX/UI",
  },
  {
    "ID insight": "572",
    Operativa: "Performance",
    Insight:
      "La app muestra un error de conectividad a pesar de tener SIM y Wi-Fi activos.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "573",
    Operativa: "Performance",
    Insight:
      "El saldo de cuenta no se actualiza en tiempo real; hay que cerrar y reabrir la app.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "574",
    Operativa: "Hipoteca",
    Insight: "No hay otros medios de pago disponibles para pagar la hipoteca",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "575",
    Operativa: "Transferencias",
    Insight:
      "La app solicita confirmación en un cajero para hacer una transferencia móvil.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "576",
    Operativa: "Performance",
    Insight:
      "Tras actualizar, aparecen dos iconos de la app en el dispositivo.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "577",
    Operativa: "Performance",
    Insight:
      'La app no permite acceder al apartado de ahorros y muestra error de “faltan parámetros de entrada"".',
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "578",
    Operativa: "Seguridad",
    Insight: "Los usuarios perciben la app como poco segura.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "579",
    Operativa: "Huchas",
    Insight: "La hucha por redondeo no está funcionando correctamente.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "580",
    Operativa: "Tarjetas",
    Insight:
      "Se presentan trabas o demoras al solicitar una tarjeta de crédito.",
    BU: "BU Payments",
  },
  {
    "ID insight": "581",
    Operativa: "UX",
    Insight: "La app ofrece funcionalidades muy limitadas o básicas",
    BU: "UX/UI",
  },
  {
    "ID insight": "582",
    Operativa: "Huchas",
    Insight:
      "Ya no es posible editar las entradas o salidas de dinero en las huchas.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "583",
    Operativa: "Performance",
    Insight:
      "La app muestra pantalla en blanco al intentar acceder a ciertas operativas o notificaciones.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "584",
    Operativa: "Tarjetas",
    Insight:
      "No se ofrece un CVV dinámico para aumentar la seguridad en las operaciones con tarjeta.",
    BU: "BU Payments",
  },
  {
    "ID insight": "585",
    Operativa: "Tarjetas",
    Insight:
      "Los mensajes de validación de ofertas se confunden con cargos reales en la tarjeta.",
    BU: "BU Payments",
  },
  {
    "ID insight": "586",
    Operativa: "Tarjetas",
    Insight:
      "No se puede traspasar dinero de la tarjeta de crédito a la cuenta desde la app.",
    BU: "BU Payments",
  },
  {
    "ID insight": "587",
    Operativa: "Notificaciones",
    Insight:
      "No se informa a los clientes cuando hay incidencias que afectan el funcionamiento de la app.",
    BU: "CaixaBank Tech",
  },
  {
    "ID insight": "588",
    Operativa: "Cuenta corriente",
    Insight:
      "Los autorizados en cuenta no pueden visualizar la tarjeta desde la app de imagin.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "589",
    Operativa: "Transferencias",
    Insight:
      "No se encuentra información sobre los límites diarios o mensuales para transferencias.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "590",
    Operativa: "Tarjetas",
    Insight:
      "No se pueden contratar más tarjetas desde la app por superar el límite de contratos permitidos.",
    BU: "BU Payments",
  },
  {
    "ID insight": "591",
    Operativa: "Inversión",
    Insight:
      "No es fácil encontrar el número de cuenta o expediente de valores.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "592",
    Operativa: "Captación Teens",
    Insight:
      "Se presentan errores al intentar dar de alta a menores en ImaginTeens o Kids.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "593",
    Operativa: "Bizum",
    Insight:
      "Solicitan poder recuperar un bizum enviado por error o por fraude.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "594",
    Operativa: "Inversión",
    Insight: "CaixaFuturo no siempre aparece disponible en la app.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "595",
    Operativa: "Login Teens",
    Insight:
      "Al intentar cambiar la contraseña, la app solicita el cambio pero no permite continuar con el proceso.",
    BU: "BU Teens & Kids",
  },
  {
    "ID insight": "596",
    Operativa: "Seguros",
    Insight: "La información sobre seguros está poco visible en la app.",
    BU: "BU Activos y seguros",
  },
  {
    "ID insight": "597",
    Operativa: "Transferencias",
    Insight:
      "No se puede descargar el comprobante de una transferencia o de una transferencia internacional.",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "598",
    Operativa: "Inversión",
    Insight: "No se puede descargar el certificado de acciones desde la app.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "599",
    Operativa: "Fidelización",
    Insight:
      "Clientes antiguos perciben un trato desigual al no recibir los mismos beneficios o promociones que los nuevos.",
    BU: "Customer Centricity",
  },
  {
    "ID insight": "600",
    Operativa: "Inversión",
    Insight:
      "Los padres no pueden contratar ni aportar a fondos de inversión a nombre de sus hijos en ImaginTeens.",
    BU: "BU Pasivos y activos digitales",
  },
  {
    "ID insight": "602",
    Operativa: "Transferencias",
    Insight:
      "El concepto de las transferencias automáticas a la hucha no es claro y el cliente no las reconoce",
    BU: "BU Core Banking",
  },
  {
    "ID insight": "238",
    Operativa: "UX",
    Insight:
      "No resulta cómoda la ubicación de los menús ni la visibilidad de las operaciones.",
    BU: "UX/UI",
  },
  {
    "ID insight": "603",
    Operativa: "Transferencias",
    Insight:
      "Es poco intuitivo descargar el comprobante de transferencias y transferencias planificadas",
    BU: "BU Core Banking",
  },
];

async function clearDb(): Promise<void> {
  const query = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

  const tables = await DB.client.execute(query); // retrieve tables

  for (const table of tables.rows) {
    const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`);
    await DB.client.execute(query); // Truncate (clear all the data) the table
  }
}

async function seedInsights() {
  console.log("🌱 Seeding insights table...");

  try {
    await DB.executeTransaction(async (tx) => {
      const now = new Date();
      const values = insightsDb.map((insight) => ({
        name: insight.Insight.toLowerCase(),
        content: insight.Insight,
        description: insight.Insight,
        business_unit: insight.BU,
        external_id: insight["ID insight"],
        operational_area: insight.Operativa,
        ai_generated: false,
        created_at: now,
        updated_at: now,
      }));

      await tx
        .insert(DB.schema.insights)
        .values(values)
        .onConflictDoUpdate({
          target: [DB.schema.insights.name],
          set: {
            content: sql`excluded.content`,
            description: sql`excluded.description`,
            business_unit: sql`excluded.business_unit`,
            external_id: sql`excluded.external_id`,
            operational_area: sql`excluded.operational_area`,
            ai_generated: sql`excluded.ai_generated`,
            updated_at: now,
          },
        });

      console.log(`✅ Created/Updated ${values.length} insights`);
    });

    console.log("✨ Insights seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding insights:", error);
    process.exit(1);
  }
}

const intentionData = [
  {
    type: "resolve" as const,
    name: "Resolve Issue",
    description: "User wants to resolve a problem or find a solution",
  },
  {
    type: "complain" as const,
    name: "Complain",
    description: "User is expressing dissatisfaction or frustration",
  },
  {
    type: "compare" as const,
    name: "Compare",
    description: "User is comparing products, services, or options",
  },
  {
    type: "cancel" as const,
    name: "Cancel",
    description: "User wants to cancel a service, subscription, or order",
  },
  {
    type: "inquire" as const,
    name: "Inquire",
    description: "User is asking for information or clarification",
  },
  {
    type: "praise" as const,
    name: "Praise",
    description: "User is expressing satisfaction or giving positive feedback",
  },
  {
    type: "suggest" as const,
    name: "Suggest",
    description: "User is providing suggestions or recommendations",
  },
  {
    type: "other" as const,
    name: "Other",
    description: "Other types of intentions not covered above",
  },
];

async function seedIntentions() {
  console.log("🌱 Seeding intentions table...");

  try {
    await DB.executeTransaction(async (tx) => {
      for (const intention of intentionData) {
        await tx
          .insert(DB.schema.intentions)
          .values(intention)
          .onConflictDoUpdate({
            target: [DB.schema.intentions.name],
            set: {
              description: intention.description,
              updated_at: new Date(),
            },
          });
        console.log(`✅ Created/Updated intention: ${intention.name}`);
      }
    });

    console.log("✨ Intentions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding intentions:", error);
    process.exit(1);
  }
}

const sentimentLevelData = [
  // Negative sentiments (90% of comments)
  {
    level: "doubt" as const,
    name: "Doubt",
    description: "Initial uncertainty, customer still confident but unsure",
    severity: "low" as const,
    intensity_value: -1,
  },
  {
    level: "concern" as const,
    name: "Concern",
    description: "Growing unease, seeking confirmation and reassurance",
    severity: "low" as const,
    intensity_value: -2,
  },
  {
    level: "annoyance" as const,
    name: "Annoyance",
    description: "First clear irritation, expectations not being met",
    severity: "medium" as const,
    intensity_value: -3,
  },
  {
    level: "frustration" as const,
    name: "Frustration",
    description: "Loss of patience, needs urgent support",
    severity: "medium" as const,
    intensity_value: -4,
  },
  {
    level: "anger" as const,
    name: "Anger",
    description: "Manifest anger, very negative experience",
    severity: "high" as const,
    intensity_value: -5,
  },
  {
    level: "outrage" as const,
    name: "Outrage",
    description: "Sense of injustice, expectations far below standards",
    severity: "high" as const,
    intensity_value: -6,
  },
  {
    level: "contempt" as const,
    name: "Contempt",
    description: "Total rejection of product or service",
    severity: "critical" as const,
    intensity_value: -7,
  },
  {
    level: "fury" as const,
    name: "Fury",
    description: "Emotional explosion, threats, point of no return",
    severity: "critical" as const,
    intensity_value: -8,
  },
  // Neutral sentiment (8% of comments)
  {
    level: "neutral" as const,
    name: "Neutral",
    description: "Objective reports without emotional charge",
    severity: "none" as const,
    intensity_value: 0,
  },
  // Positive sentiments (2% of comments)
  {
    level: "satisfaction" as const,
    name: "Satisfaction",
    description: "Problem resolved, expectations met",
    severity: "positive" as const,
    intensity_value: 1,
  },
  {
    level: "gratitude" as const,
    name: "Gratitude",
    description: "Explicit recognition of good service",
    severity: "positive" as const,
    intensity_value: 2,
  },
];

async function seedSentimentLevels() {
  console.log("🌱 Seeding sentiment_levels table...");

  try {
    await DB.executeTransaction(async (tx) => {
      for (const sentimentLevel of sentimentLevelData) {
        await tx
          .insert(DB.schema.sentiment_levels)
          .values(sentimentLevel)
          .onConflictDoUpdate({
            target: [DB.schema.sentiment_levels.level],
            set: {
              name: sentimentLevel.name,
              description: sentimentLevel.description,
              severity: sentimentLevel.severity,
              intensity_value: sentimentLevel.intensity_value,
              updated_at: new Date(),
            },
          });
        console.log(
          `✅ Created/Updated sentiment level: ${sentimentLevel.name} (${sentimentLevel.level})`
        );
      }
    });

    console.log("✨ Sentiment levels seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding sentiment levels:", error);
    process.exit(1);
  }
}

async function seed() {
  await clearDb();
  await seedInsights();
  await seedIntentions();
  await seedSentimentLevels();
}

seed();
