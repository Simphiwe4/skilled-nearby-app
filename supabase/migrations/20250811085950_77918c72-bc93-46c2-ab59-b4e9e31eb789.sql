-- Create trigger to automatically update provider ratings when reviews are added/updated
CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_rating();

-- Update existing provider ratings and review counts
UPDATE public.service_providers 
SET 
  average_rating = COALESCE((
    SELECT AVG(rating)
    FROM public.reviews
    WHERE provider_id = service_providers.id
  ), 0),
  total_reviews = COALESCE((
    SELECT COUNT(*)
    FROM public.reviews
    WHERE provider_id = service_providers.id
  ), 0);