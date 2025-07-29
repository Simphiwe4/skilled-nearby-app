import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RatingDisplay from "./RatingDisplay";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface ReviewsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  providerName: string;
  averageRating: number;
}

const ReviewsViewModal = ({
  isOpen,
  onClose,
  reviews,
  providerName,
  averageRating
}: ReviewsViewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Reviews for {providerName}</span>
            <RatingDisplay 
              rating={averageRating} 
              totalReviews={reviews.length}
              size="md"
            />
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profiles.avatar_url} />
                    <AvatarFallback>
                      {review.profiles.first_name[0]}{review.profiles.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {review.profiles.first_name} {review.profiles.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at))} ago
                        </p>
                      </div>
                      <RatingDisplay 
                        rating={review.rating} 
                        size="sm" 
                        showText={false}
                      />
                    </div>
                    {review.comment && (
                      <p className="text-sm">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsViewModal;