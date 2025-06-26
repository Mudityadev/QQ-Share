import { Button } from "@/components/ui/button";
import { Crown, Zap, Shield, Upload } from "lucide-react";

interface ProUpgradeProps {
  onUpgrade?: () => void;
  variant?: "rate-limit" | "file-size" | "general";
  remainingTime?: number;
}

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
const PRO_FILE_SIZE_MB = parseInt(process.env.PRO_FILE_SIZE_MB || "100", 10);
const MAX_UPLOADS_PER_WINDOW = parseInt(process.env.MAX_UPLOADS_PER_WINDOW || "2", 10);

export function ProUpgrade({ onUpgrade, variant = "general", remainingTime }: ProUpgradeProps) {
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

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-[#18192a] to-[#23243a] border border-purple-700/40 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2 drop-shadow">{getTitle()}</h3>
        <p className="text-gray-300 text-sm leading-relaxed drop-shadow-sm">{getDescription()}</p>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-700/30 rounded-lg flex items-center justify-center shadow">
              <feature.icon className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white drop-shadow">{feature.title}</h4>
              <p className="text-xs text-gray-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-purple-700/40"
        >
          <Crown className="w-4 h-4 mr-2 text-white" />
          Upgrade to Pro - $9.99/month
        </Button>
        
        {variant === "rate-limit" && remainingTime && (
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Or wait {Math.ceil(remainingTime / 60)} minutes for free tier reset
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 