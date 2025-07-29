import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ServiceListingForm from "@/components/ServiceListingForm";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Save,
  Star,
  Briefcase,
  Clock,
  ArrowLeft,
  Plus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  user_type: 'client' | 'provider';
  first_name: string;
  last_name: string;
  phone_number?: string;
  avatar_url?: string;
  location?: string;
}

interface ServiceProvider {
  id: string;
  business_name?: string;
  description?: string;
  skills?: string[];
  experience_years?: number;
  hourly_rate?: number;
  verification_status: 'pending' | 'approved' | 'suspended';
}

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    location: '',
    business_name: '',
    description: '',
    skills: '',
    experience_years: '',
    hourly_rate: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || '',
        location: profileData.location || '',
        business_name: '',
        description: '',
        skills: '',
        experience_years: '',
        hourly_rate: ''
      });

      // If provider, fetch provider data
      if (profileData.user_type === 'provider') {
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('*')
          .eq('profile_id', profileData.id)
          .single();

        if (providerData) {
          setServiceProvider(providerData);
          setFormData(prev => ({
            ...prev,
            business_name: providerData.business_name || '',
            description: providerData.description || '',
            skills: providerData.skills?.join(', ') || '',
            experience_years: providerData.experience_years?.toString() || '',
            hourly_rate: providerData.hourly_rate?.toString() || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          location: formData.location
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // If provider, update or create provider data
      if (profile?.user_type === 'provider') {
        const providerData = {
          profile_id: profile.id,
          business_name: formData.business_name,
          description: formData.description,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
        };

        if (serviceProvider) {
          const { error } = await supabase
            .from('service_providers')
            .update(providerData)
            .eq('id', serviceProvider.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('service_providers')
            .insert(providerData);
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-primary-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-primary-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">
              Skilled Nearby
            </span>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elevated border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant={profile.user_type === 'provider' ? 'default' : 'secondary'}>
                  {profile.user_type === 'provider' ? 'Service Provider' : 'Client'}
                </Badge>
                {profile.user_type === 'provider' && serviceProvider && (
                  <Badge variant={
                    serviceProvider.verification_status === 'approved' ? 'default' : 
                    serviceProvider.verification_status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {serviceProvider.verification_status}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  {profile.user_type === 'provider' && (
                    <TabsTrigger value="business">Business Info</TabsTrigger>
                  )}
                  {profile.user_type === 'provider' && (
                    <TabsTrigger value="services">My Services</TabsTrigger>
                  )}
                  <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editing ? handleSave() : setEditing(true)}
                    >
                      {editing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                      {editing ? 'Save' : 'Edit'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      {editing ? (
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 border rounded-md">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.first_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      {editing ? (
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 border rounded-md">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.last_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      {editing ? (
                        <Input
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 border rounded-md">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.phone_number || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      {editing ? (
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 border rounded-md">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.location || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {profile.user_type === 'provider' && (
                  <TabsContent value="business" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Business Information</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editing ? handleSave() : setEditing(true)}
                      >
                        {editing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                        {editing ? 'Save' : 'Edit'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        {editing ? (
                          <Input
                            id="business_name"
                            value={formData.business_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 border rounded-md">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{serviceProvider?.business_name || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hourly_rate">Hourly Rate (R)</Label>
                        {editing ? (
                          <Input
                            id="hourly_rate"
                            type="number"
                            value={formData.hourly_rate}
                            onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 border rounded-md">
                            <span>R{serviceProvider?.hourly_rate || 'Not set'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        {editing ? (
                          <Input
                            id="experience_years"
                            type="number"
                            value={formData.experience_years}
                            onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 border rounded-md">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{serviceProvider?.experience_years || 0} years</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma separated)</Label>
                        {editing ? (
                          <Input
                            id="skills"
                            value={formData.skills}
                            onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                            placeholder="e.g. Plumbing, Electrical, Repairs"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                            {serviceProvider?.skills?.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            )) || <span className="text-muted-foreground">No skills listed</span>}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        {editing ? (
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your services and experience..."
                            rows={4}
                          />
                        ) : (
                          <div className="p-2 border rounded-md min-h-[100px]">
                            <span>{serviceProvider?.description || 'No description provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {profile.user_type === 'provider' && serviceProvider && (
                  <TabsContent value="services" className="space-y-6">
                    <ServiceListingForm providerId={serviceProvider.id} />
                  </TabsContent>
                )}

                <TabsContent value="bookings" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">My Bookings</h3>
                    <Link to="/bookings">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet. <Link to="/search" className="text-primary hover:underline">Find services</Link> to get started.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;