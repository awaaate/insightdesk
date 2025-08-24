import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  InputOTP,
  InputOTPSlot,
  InputOTPSeparator,
  InputOTPGroup,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import {
  LoaderIcon,
  Shield,
  ChartBar,
  TrendingUp,
  BarChart3,
  Activity,
  Sparkles,
  Lock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  KeyRound,
  Database,
  LineChart,
  Globe,
  Zap,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Constants for the login page
const LOGIN_CONTENT = {
  TITLE: "Analytics Platform",
  SUBTITLE: "AI-Powered Brand Intelligence",
  FEATURES: [
    {
      icon: LineChart,
      title: "Real-time Monitoring",
      description: "Track brand mentions across AI platforms 24/7",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      title: "Sentiment Analysis",
      description: "Understand how AI perceives your brand",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Monitor mentions across multiple sources",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Zap,
      title: "Instant Insights",
      description: "Get actionable recommendations from data",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ],
  STATS: [
    { value: "10M+", label: "Data Points" },
    { value: "500+", label: "Sources" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Monitoring" },
  ],
  FORM: {
    title: "Welcome Back",
    subtitle: "Enter your access code to continue",
    codeLabel: "Access Code",
    submitButton: "Continue",
    submittingButton: "Verifying...",
    helpText: "Having trouble?",
    helpLink: "Contact support",
  },
  SECURITY: {
    badge: "Enterprise Security",
    message: "256-bit encryption • SOC 2 compliant",
  },
} as const;

export const LoginPage = () => {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  const { data: info, isPending: isInfoPending } = useQuery(
    trpc.auth.info.queryOptions()
  );
  const { mutate: login, isPending } = useMutation(
    trpc.auth.login.mutationOptions()
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(code: string) {
    login(
      { code },
      {
        onSuccess: (data) => {
          localStorage.setItem("auth-token", data.token);
          toast.success("Authentication successful", {
            description: "Redirecting to dashboard...",
          });
          setTimeout(() => {
            router.navigate({ to: "/dashboard" });
          }, 500);
        },
        onError: (error) => {
          toast.error("Authentication failed", {
            description: error.message || "Please check your access code",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-brand/10 to-brand/5">
      {/* Right side - Login form */}
      <div className="relative z-10 w-full flex">
        {isInfoPending ? (
          <LoginFormSkeleton />
        ) : (
          <LoginForm
            onSubmit={onSubmit}
            isPending={isPending}
            showContent={showContent}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-black/20 bg-blur-xl" />
    </div>
  );
};

interface LoginFormProps {
  onSubmit: (code: string) => void;
  isPending: boolean;
  showContent?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isPending,
  showContent = false,
}) => {
  const [studyCode, setStudyCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleCodeChange = (value: string) => {
    setStudyCode(value);
    setCodeError(false);
    if (!touched && value.length > 0) {
      setTouched(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studyCode.length !== 6) {
      setCodeError(true);
      toast.error("Invalid code", {
        description: "Please enter a 6-digit access code",
      });
      return;
    }
    onSubmit(studyCode);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8  ">
      <div className="w-full max-w-md">
        {/* Mobile header */}
        <div
          className={cn(
            "lg:hidden mb-8 text-center transition-all duration-700",
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{LOGIN_CONTENT.TITLE}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {LOGIN_CONTENT.SUBTITLE}
          </p>
        </div>

        {/* Login card */}
        <Card
          className={cn(
            "border shadow-none  transition-all duration-700  rounded-lg overflow-hidden bg-background",
            showContent
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95",
            codeError && "animate-shake border-destructive/50"
          )}
        >
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 backdrop-blur-sm border border-brand/20">
                <KeyRound className="h-8 w-8 text-brand" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {LOGIN_CONTENT.FORM.title}
            </CardTitle>
            <CardDescription>{LOGIN_CONTENT.FORM.subtitle}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Access code input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {LOGIN_CONTENT.FORM.codeLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />6 digits
                    </Badge>
                    {touched && studyCode.length === 6 && (
                      <CheckCircle className="h-4 w-4 text-emerald-500 animate-in fade-in-50 zoom-in-95" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={studyCode}
                      onChange={handleCodeChange}
                      disabled={isPending}
                      className={cn("gap-2", codeError && "animate-shake")}
                    >
                      <InputOTPGroup className="gap-2">
                        {[...Array(3)].map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn(
                              "h-14 w-14 text-lg border-2",
                              studyCode.length >= i
                                ? "border-brand"
                                : "border-muted"
                            )}
                          />
                        ))}
                      </InputOTPGroup>

                      <InputOTPSeparator
                        className={cn(
                          studyCode.length > 3 ? "text-brand" : "text-muted"
                        )}
                      />

                      <InputOTPGroup className="gap-2">
                        {[...Array(3)].map((_, i) => (
                          <InputOTPSlot
                            index={i + 3}
                            className={cn(
                              "h-14 w-14 text-lg border-2",
                              studyCode.length >= i + 3
                                ? "border-brand"
                                : "border-muted"
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isPending || studyCode.length !== 6}
                className="w-full h-12 font-semibold text-base transition-all bg-brand text-brand-foreground hover:bg-brand/90 hover:text-brand-foreground cursor-pointer"
                size="lg"
              >
                {isPending ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    {LOGIN_CONTENT.FORM.submittingButton}
                  </>
                ) : (
                  <>
                    {LOGIN_CONTENT.FORM.submitButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help link */}
        <div
          className={cn(
            "mt-8 text-center transition-all duration-700",
            showContent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: "200ms" }}
        >
          <p className="text-sm text-muted-foreground">
            {LOGIN_CONTENT.FORM.helpText}{" "}
            <button
              onClick={() =>
                toast.info("Support", {
                  description:
                    "Please contact your administrator for assistance",
                })
              }
              className="font-medium text-primary hover:underline underline-offset-4 transition-colors inline-flex items-center gap-1"
            >
              {LOGIN_CONTENT.FORM.helpLink}
              <HelpCircle className="h-3 w-3" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginFormSkeleton = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Mobile header skeleton */}
        <div className="lg:hidden mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64 mt-2" />
        </div>

        {/* Card skeleton */}
        <Card className="border shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <Skeleton className="mx-auto h-16 w-16 rounded-full mb-4" />
            <Skeleton className="mx-auto h-7 w-44" />
            <Skeleton className="mx-auto h-4 w-56 mt-2" />
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-center gap-2">
                  {/* OTP slots skeleton */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <div className="mx-2 h-1.5 w-8 bg-border rounded-full" />
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <Skeleton className="h-14 w-14 rounded-md" />
                    <Skeleton className="h-14 w-14 rounded-md" />
                  </div>
                </div>

                {/* Progress indicator skeleton */}
                <div className="flex justify-center gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-1.5 w-10 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            <Skeleton className="w-full h-12 rounded-md" />
            <Skeleton className="w-full h-16 rounded-md" />
          </CardContent>
        </Card>

        {/* Help link skeleton */}
        <div className="mt-8 text-center">
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
      </div>
    </div>
  );
};

// Add shake animation styles
const styles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
