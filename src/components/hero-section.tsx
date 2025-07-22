import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Wrench, 
  GraduationCap, 
  Scissors, 
  Car,
  Paintbrush,
  Zap,
  Truck,
  Camera
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");

  const popularServices = [
    { name: "Handyman", icon: Wrench, color: "bg-blue-100 text-blue-700" },
    { name: "Tutor", icon: GraduationCap, color: "bg-green-100 text-green-700" },
    { name: "Hair Stylist", icon: Scissors, color: "bg-purple-100 text-purple-700" },
    { name: "Mechanic", icon: Car, color: "bg-red-100 text-red-700" },
    { name: "Painter", icon: Paintbrush, color: "bg-yellow-100 text-yellow-700" },
    { name: "Electrician", icon: Zap, color: "bg-orange-100 text-orange-700" },
    { name: "Moving", icon: Truck, color: "bg-indigo-100 text-indigo-700" },
    { name: "Photography", icon: Camera, color: "bg-pink-100 text-pink-700" },
  ];

  const handleSearch = () => {
    // Navigate to search results
    console.log("Searching for:", service, "in", location);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero pb-20 md:pb-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="inline-flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span>Serving South Africa</span>
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Find{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  skilled talent
                </span>{" "}
                in your neighborhood
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md">
                Connect with local service providers - from handymen to tutors, 
                hairdressers to mechanics. Get quality work done by people you can trust.
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-card/80 backdrop-blur rounded-2xl p-6 shadow-card border">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">What service do you need?</label>
                    <Input
                      placeholder="e.g. Handyman, Tutor, Cleaner"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Where?</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Your location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="w-full h-12 bg-gradient-primary shadow-primary"
                  size="lg"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Services
                </Button>
              </div>
            </div>

            {/* Popular Services */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Popular Services</h3>
              <div className="flex flex-wrap gap-2">
                {popularServices.map((service) => (
                  <Button
                    key={service.name}
                    variant="secondary"
                    size="sm"
                    className="h-auto py-2 px-3 hover:scale-105 transition-transform"
                  >
                    <service.icon className="h-3 w-3 mr-2" />
                    {service.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img
                src={heroImage}
                alt="Skilled service providers in South Africa"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-elevated border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">5k+</span>
                </div>
                <div>
                  <p className="font-semibold">Service Providers</p>
                  <p className="text-sm text-muted-foreground">Ready to help</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-4 shadow-elevated border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-accent-foreground">4.8</span>
                </div>
                <div>
                  <p className="font-semibold">Average Rating</p>
                  <p className="text-sm text-muted-foreground">From 10k+ reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;