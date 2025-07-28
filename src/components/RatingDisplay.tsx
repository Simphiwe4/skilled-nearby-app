import { Star, StarHalf } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const RatingDisplay = ({ 
  rating, 
  totalReviews, 
  size = "md", 
  showText = true 
}: RatingDisplayProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half"
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      );
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      );
    }

    return stars;
  };

  if (rating === 0 && !totalReviews) {
    return (
      <div className="flex items-center space-x-1">
        <span className={`${textSizeClasses[size]} text-muted-foreground`}>
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {renderStars()}
      </div>
      {showText && (
        <div className="flex items-center space-x-1">
          <span className={`${textSizeClasses[size]} font-medium`}>
            {rating.toFixed(1)}
          </span>
          {totalReviews !== undefined && (
            <span className={`${textSizeClasses[size]} text-muted-foreground`}>
              ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;