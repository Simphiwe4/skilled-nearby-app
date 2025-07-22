import Navigation from "@/components/ui/navigation";
import HeroSection from "@/components/hero-section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Shield, 
  Clock, 
  Users,
  MapPin,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All service providers are background checked and verified for your safety."
    },
    {
      icon: MapPin,
      title: "Local & Nearby",
      description: "Find skilled professionals right in your neighborhood."
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Book services instantly or schedule for later - it's that simple."
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Read reviews and ratings from real customers before you book."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Cape Town",
      rating: 5,
      text: "Found an amazing handyman through Skilled Nearby. Quick, professional, and affordable!",
      service: "Handyman"
    },
    {
      name: "Michael R.",
      location: "Johannesburg", 
      rating: 5,
      text: "The tutor I found helped my daughter improve her maths grades significantly.",
      service: "Tutoring"
    },
    {
      name: "Priya K.",
      location: "Durban",
      rating: 5,
      text: "Excellent hair stylist! She understood exactly what I wanted.",
      service: "Hair Styling"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pb-24 md:pb-0">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Why Choose Skilled Nearby?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Connect with trusted professionals
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We make it easy to find reliable, skilled professionals in your area. 
                From quick fixes to major projects, we've got you covered.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-card transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                Getting help has never been easier
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Tell us what you need",
                  description: "Describe your project and we'll match you with the right professionals"
                },
                {
                  step: "2", 
                  title: "Compare & choose",
                  description: "Browse profiles, read reviews, and compare prices to find your perfect match"
                },
                {
                  step: "3",
                  title: "Get it done",
                  description: "Book your service and enjoy quality work from verified professionals"
                }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary-foreground">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {index < 2 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What our users say
              </h2>
              <p className="text-lg text-muted-foreground">
                Real stories from real people
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-card transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                      <Badge variant="outline">{testimonial.service}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of South Africans who are already connecting with skilled professionals in their area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Find Services
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Become a Provider
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
