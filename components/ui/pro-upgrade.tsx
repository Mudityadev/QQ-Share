import { Button } from "@/components/ui/button";
import { Crown, Zap, Shield, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as React from "react";

interface ProUpgradeProps {
  onUpgrade?: () => void;
  variant?: "rate-limit" | "file-size" | "general";
  remainingTime?: number; // in seconds
  onTimerEnd?: () => void;
}

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
const PRO_FILE_SIZE_MB = parseInt(process.env.PRO_FILE_SIZE_MB || "100", 10);
const MAX_UPLOADS_PER_WINDOW = parseInt(process.env.MAX_UPLOADS_PER_WINDOW || "2", 10);

export function ProUpgrade({ onUpgrade, variant = "general", remainingTime, onTimerEnd }: ProUpgradeProps) {
  const [timer, setTimer] = React.useState(remainingTime || 0);

  React.useEffect(() => {
    if (variant === "rate-limit" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev > 1) return prev - 1;
          clearInterval(interval);
          if (onTimerEnd) onTimerEnd();
          return 0;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [variant, timer, onTimerEnd]);

  React.useEffect(() => {
    if (typeof remainingTime === "number") setTimer(remainingTime);
  }, [remainingTime]);

  const getTitle = () => {
    switch (variant) {
      case "rate-limit":
        return "Upgrade to Pro";
      case "file-size":
        return "File Too Large";
      default:
        return "Upgrade to Pro";
    }
  };

  const getDescription = () => {
    switch (variant) {
      case "rate-limit":
        return `Unlock unlimited uploads and never wait again.`;
      case "file-size":
        return `Your file exceeds the ${MAX_FILE_SIZE_MB}MB free tier limit. Upgrade to Pro for files up to ${PRO_FILE_SIZE_MB}MB.`;
      default:
        return "Unlock unlimited uploads, larger files, and premium features.";
    }
  };

  const features = [
    {
      icon: Upload,
      title: "Unlimited Uploads",
      description: "No more waiting between uploads"
    },
    {
      icon: Zap,
      title: "Larger Files",
      description: `Upload files up to ${PRO_FILE_SIZE_MB}MB`
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "Get help when you need it"
    },
    {
      icon: Crown,
      title: "Premium Features",
      description: "Advanced sharing options"
    }
  ];

  const formatTimer = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-xl p-6 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-4 shadow-lg">
          <Crown className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{getTitle()}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{getDescription()}</p>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center shadow">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button 
          onClick={onUpgrade}
          className="w-full"
        >
          <Crown className="w-4 h-4 mr-2 text-primary-foreground" />
          Upgrade to Pro - $9.99/month
        </Button>
        {variant === "rate-limit" && timer > 0 && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <Badge variant="outline" className="align-middle w-fit">
              {formatTimer(timer)}
            </Badge>
            <span className="text-xs text-muted-foreground mt-1">
              Or wait {Math.ceil(timer / 60)} minute{Math.ceil(timer / 60) !== 1 ? "s" : ""} for free tier reset
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 