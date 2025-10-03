import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { X, Plus, Briefcase, Upload, Camera } from "lucide-react";

interface ServiceProviderSetupProps {
  onSetupComplete: () => void;
}

const ServiceProviderSetup = ({ onSetupComplete }: ServiceProviderSetupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    experienceYears: '',
    hourlyRate: '',
    serviceRadius: '10',
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName || !formData.description) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Update profile with avatar URL if uploaded
      if (avatarUrl) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error updating avatar:', updateError);
        }
      }

      // Create service provider profile
      const { error } = await supabase
        .from('service_providers')
        .insert({
          profile_id: profile.id,
          business_name: formData.businessName,
          description: formData.description,
          experience_years: parseInt(formData.experienceYears) || 0,
          hourly_rate: parseFloat(formData.hourlyRate) || null,
          service_radius: parseInt(formData.serviceRadius),
          skills: formData.skills,
          verification_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Business Listed!",
        description: "Your business profile has been created and is pending verification.",
      });

      onSetupComplete();
    } catch (error) {
      console.error('Error creating provider profile:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to create your provider profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>List Your Business Online</span>
          </CardTitle>
          <div className="flex space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  stepNum <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label>Business Logo / Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="avatar"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Company/Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., ABC Plumbing Services, Quick Fix Home Repairs"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your company's services, team, and what makes you stand out..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears">Years in Business</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  placeholder="5"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: e.target.value }))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing & Coverage</h3>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Starting Rate (R/hour)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="200"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceRadius">Service Radius (km)</Label>
                <Select 
                  value={formData.serviceRadius} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serviceRadius: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services Offered</h3>
              
              <div className="space-y-2">
                <Label>Add Services/Skills</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="e.g., Plumbing, Electrical work, Home repairs"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.skills.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Services</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="pr-1">
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-gradient-primary">
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-primary"
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderSetup;