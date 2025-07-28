-- Create messages table for messaging system
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create foreign key constraints
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create policies for messaging
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE id = sender_id
  UNION
  SELECT user_id FROM public.profiles WHERE id = receiver_id
));

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = sender_id AND user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_booking ON public.messages(booking_id);