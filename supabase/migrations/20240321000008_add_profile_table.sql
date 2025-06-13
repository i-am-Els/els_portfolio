-- Create profile table
CREATE TABLE profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bio TEXT,
    short_bio TEXT,
    profile_image_url TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    github_url TEXT,
    artstation_url TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create experiences table
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT NOT NULL,
    skills TEXT[] NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    items TEXT[] NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Profile is viewable by everyone" ON profile
    FOR SELECT USING (true);

CREATE POLICY "Profile is editable by authenticated users" ON profile
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Experiences policies
CREATE POLICY "Experiences are viewable by everyone" ON experiences
    FOR SELECT USING (true);

CREATE POLICY "Experiences are editable by authenticated users" ON experiences
    FOR ALL USING (auth.role() = 'authenticated');

-- Skills policies
CREATE POLICY "Skills are viewable by everyone" ON skills
    FOR SELECT USING (true);

CREATE POLICY "Skills are editable by authenticated users" ON skills
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
    BEFORE UPDATE ON experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 