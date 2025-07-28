import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface SearchFilters {
  priceRange: [number, number];
  rating: string;
  category: string;
  distance: string;
  availability: string;
  sortBy: string;
}

interface AdvancedSearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: Array<{ id: string; name: string }>;
}

const AdvancedSearchFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  categories 
}: AdvancedSearchFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: SearchFilters = {
      priceRange: [0, 1000],
      rating: "",
      category: "",
      distance: "",
      availability: "",
      sortBy: "newest"
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.rating) count++;
    if (localFilters.distance) count++;
    if (localFilters.availability) count++;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 1000) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <Card className="border shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary">
                  {getActiveFiltersCount()} active
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label>Price Range (R)</Label>
              <div className="px-2">
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => 
                    setLocalFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                  }
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>R{localFilters.priceRange[0]}</span>
                  <span>R{localFilters.priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label>Service Category</Label>
              <Select
                value={localFilters.category}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label>Minimum Rating</Label>
              <Select
                value={localFilters.rating}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, rating: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any rating</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                  <SelectItem value="4.0">4+ stars</SelectItem>
                  <SelectItem value="3.5">3.5+ stars</SelectItem>
                  <SelectItem value="3.0">3+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance */}
            <div className="space-y-3">
              <Label>Distance</Label>
              <Select
                value={localFilters.distance}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, distance: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any distance</SelectItem>
                  <SelectItem value="1">Within 1 km</SelectItem>
                  <SelectItem value="5">Within 5 km</SelectItem>
                  <SelectItem value="10">Within 10 km</SelectItem>
                  <SelectItem value="25">Within 25 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <Label>Availability</Label>
              <Select
                value={localFilters.availability}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, availability: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  <SelectItem value="today">Available today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
              <Label>Sort By</Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="reviews">Most reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleResetFilters} className="flex-1">
              Reset All
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1 bg-gradient-primary">
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;