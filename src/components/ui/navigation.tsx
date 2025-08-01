import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  Search, 
  User, 
  Calendar,
  Menu,
  X,
  Star,
  MapPin,
  LogIn,
  Settings,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const location = useLocation();

  useEffect(() => {
    if (user) {
      getUserType();
    }
  }, [user]);

  const getUserType = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserType(data.user_type);
    } catch (error) {
      console.error('Error fetching user type:', error);
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { href: "/", label: "Home", icon: Home },
      { href: "/search", label: "Find Services", icon: Search },
    ];

    if (user) {
      baseItems.push({ href: "/messages", label: "Messages", icon: MessageCircle });
      
      if (userType === 'provider') {
        baseItems.push(
          { href: "/provider-dashboard", label: "Dashboard", icon: Settings },
          { href: "/profile", label: "Profile", icon: User }
        );
      } else {
        baseItems.push(
          { href: "/client-dashboard", label: "My Bookings", icon: Calendar },
          { href: "/profile", label: "Profile", icon: User }
        );
      }
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop/Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Skilled Nearby
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.href) 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {user ? (
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>Profile</span>
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="bg-gradient-primary">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t bg-card/95 backdrop-blur">
            <nav className="container px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="pt-2 border-t">
                {user ? (
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="w-full">
                      <Avatar className="h-4 w-4 mr-2">
                        <AvatarFallback className="text-xs">
                          {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      Profile
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="w-full bg-gradient-primary">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
        <nav className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs font-medium transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive(item.href) && "text-primary"
              )} />
              <span className="truncate">{item.label}</span>
              {isActive(item.href) && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Navigation;