-- Enable RLS on both tables
ALTER TABLE public."Player's table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for Player's table to allow anyone to create and read players
CREATE POLICY "Anyone can create players" 
ON public."Player's table" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read players" 
ON public."Player's table" 
FOR SELECT 
USING (true);

-- Create policies for Leaderboard to allow anyone to create and read leaderboard entries
CREATE POLICY "Anyone can create leaderboard entries" 
ON public.Leaderboard 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read leaderboard entries" 
ON public.Leaderboard 
FOR SELECT 
USING (true);