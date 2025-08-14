import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
}

export function InviteModal({ isOpen, onClose, inviteCode }: InviteModalProps) {
  const { toast } = useToast();
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite code",
        variant: "destructive",
      });
    }
  };

  const shareInviteLink = async () => {
    const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our family on LoboHub',
          text: `Use invite code: ${inviteCode}`,
          url: inviteUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast({
          title: "Copied!",
          description: "Invite link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to copy invite link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-invite-family">
        <DialogHeader>
          <DialogTitle>Invite Family Member</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">Family Invite Code</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                id="inviteCode"
                value={inviteCode}
                readOnly
                className="font-mono text-center bg-gray-50"
                data-testid="input-invite-code-display"
              />
              <Button 
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                data-testid="button-copy-invite-code"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this code with family members to join your hub
            </p>
          </div>
          
          <Button 
            onClick={shareInviteLink}
            className="w-full"
            data-testid="button-share-invite-link"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Invite Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
