import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus } from "lucide-react";

export default function FamilySetup() {
  const { updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createFamily = async () => {
    if (!familyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a family name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/families', {
        name: familyName.trim()
      });
      const family = await response.json();
      
      updateUser({ familyId: family.id });
      
      toast({
        title: "Success!",
        description: `Family "${family.name}" created successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create family. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinFamily = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/families/join', {
        inviteCode: inviteCode.trim().toUpperCase()
      });
      const family = await response.json();
      
      updateUser({ familyId: family.id });
      
      toast({
        title: "Success!",
        description: `Joined "${family.name}" family!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid invite code. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Your Family Hub</h1>
          <p className="text-gray-600 mt-2">
            Create a new family or join an existing one to get started
          </p>
        </div>

        <Card data-testid="card-create-family">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Enter your family name"
                data-testid="input-family-name"
              />
            </div>
            <Button 
              onClick={createFamily} 
              disabled={isLoading}
              className="w-full"
              data-testid="button-create-family"
            >
              {isLoading ? "Creating..." : "Create Family"}
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-50 px-2 text-gray-500">Or</span>
          </div>
        </div>

        <Card data-testid="card-join-family">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join Existing Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="BLUE-OCEAN-74"
                className="font-mono"
                data-testid="input-invite-code"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the invite code shared by your family member
              </p>
            </div>
            <Button 
              onClick={joinFamily} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
              data-testid="button-join-family"
            >
              {isLoading ? "Joining..." : "Join Family"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
