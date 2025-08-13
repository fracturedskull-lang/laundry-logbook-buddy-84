import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { LaundryEntry } from "@/types/laundry";
import { Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeTextInput, sanitizeWeight, formRateLimiter } from "@/lib/security";

interface LaundryEntryFormProps {
  onAddEntry: (entry: Omit<LaundryEntry, 'id' | 'timestamp'>) => Promise<void>;
}

export const LaundryEntryForm = ({ onAddEntry }: LaundryEntryFormProps) => {
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
  const [weight, setWeight] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (!formRateLimiter.canSubmit()) {
      const timeLeft = Math.ceil(formRateLimiter.getTimeUntilNext() / 1000);
      setCooldownTime(timeLeft);
      const interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      toast({
        title: "Please Wait",
        description: `Too many requests. Please wait ${timeLeft} seconds before submitting again.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!weight || !signedBy.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in weight and signature fields.",
        variant: "destructive",
      });
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight in kilograms.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Sanitize inputs before sending
      const sanitizedSignedBy = sanitizeTextInput(signedBy);
      const sanitizedNotes = notes.trim() ? sanitizeTextInput(notes) : undefined;
      
      await onAddEntry({
        type,
        weight: weightNum,
        signedBy: sanitizedSignedBy,
        notes: sanitizedNotes,
      });

      // Reset form only on success
      setWeight('');
      setSignedBy('');
      setNotes('');
      
      toast({
        title: "Entry Added",
        description: `${type === 'incoming' ? 'Incoming' : 'Outgoing'} laundry logged successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Log New Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Entry Type</Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as 'incoming' | 'outgoing')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incoming" id="incoming" />
                <Label htmlFor="incoming">Incoming Laundry</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outgoing" id="outgoing" />
                <Label htmlFor="outgoing">Outgoing Laundry</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(sanitizeWeight(e.target.value))}
                placeholder="Enter weight in kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signedBy">Signed By</Label>
              <Input
                id="signedBy"
                value={signedBy}
                onChange={(e) => setSignedBy(sanitizeTextInput(e.target.value))}
                maxLength={100}
                placeholder="Enter name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(sanitizeTextInput(e.target.value))}
              maxLength={500}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || cooldownTime > 0} 
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {cooldownTime > 0 ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Wait {cooldownTime}s
              </>
            ) : isSubmitting ? (
              <>
                <Plus className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Log Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};