import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RatingDisplay from "./RatingDisplay";
import { Star, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_profile: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface ReviewsListProps {
  providerId: string;
}

const ReviewsList = ({ providerId }: ReviewsListProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_profile:profiles!reviews_reviewer_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No reviews yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to leave a review for this provider
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customer Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer_profile.avatar_url} />
                      <AvatarFallback>
                        {review.reviewer_profile.first_name[0]}
                        {review.reviewer_profile.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">
                        {review.reviewer_profile.first_name} {review.reviewer_profile.last_name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <RatingDisplay rating={review.rating} showText={false} size="sm" />
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;