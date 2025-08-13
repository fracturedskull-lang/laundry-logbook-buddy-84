import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { LaundryEntry } from "@/types/laundry";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LaundryEntryFormProps {
  onAddEntry: (entry: Omit<LaundryEntry, 'id' | 'timestamp'>) => void;
}

export const LaundryEntryForm = ({ onAddEntry }: LaundryEntryFormProps) => {
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
  const [weight, setWeight] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || !signedBy) {
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

    onAddEntry({
      type,
      weight: weightNum,
      signedBy: signedBy.trim(),
      notes: notes.trim() || undefined,
    });

    // Reset form
    setWeight('');
    setSignedBy('');
    setNotes('');
    
    toast({
      title: "Entry Added",
      description: `${type === 'incoming' ? 'Incoming' : 'Outgoing'} laundry logged successfully.`,
    });
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
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight in kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signedBy">Signed By</Label>
              <Input
                id="signedBy"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
            Log Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};