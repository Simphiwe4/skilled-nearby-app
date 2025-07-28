import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  onReviewSubmitted?: () => void;
}

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  providerId, 
  providerName, 
  serviceName,
  onReviewSubmitted 
}: ReviewModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get reviewer profile
      const { data: reviewerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Submit review
      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: reviewerProfile.id,
          provider_id: providerId,
          booking_id: bookingId,
          rating: rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback",
      });

      onReviewSubmitted?.();
      onClose();
      setRating(0);
      setComment("");
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold">{serviceName}</h3>
            <p className="text-sm text-muted-foreground">with {providerName}</p>
          </div>

          {/* Rating Selection */}
          <div className="space-y-3">
            <Label>How would you rate this service?</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <Label htmlFor="comment">Share your experience (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience with this service provider..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;