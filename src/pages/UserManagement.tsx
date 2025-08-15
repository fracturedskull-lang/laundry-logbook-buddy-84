
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, UserPlus, Search, Crown } from "lucide-react";
import { UserProfile, AdminUser } from "@/types/user";
import {
  fetchUserProfiles,
  updateUserProfile,
  fetchAdminUsers,
  makeUserAdmin,
  removeUserAdmin,
  makeCurrentUserAdmin,
  checkIsAdmin
} from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [userProfiles, admins, adminStatus] = await Promise.all([
        fetchUserProfiles(),
        fetchAdminUsers(),
        checkIsAdmin()
      ]);
      setUsers(userProfiles);
      setAdminUsers(admins);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMakeAdmin = async (userId: string) => {
    try {
      await makeUserAdmin(userId);
      toast({
        title: "Success",
        description: "User has been made an admin"
      });
      loadData();
    } catch (error) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: "Failed to make user admin",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeUserAdmin(userId);
      toast({
        title: "Success",
        description: "Admin privileges removed"
      });
      loadData();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin privileges",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      await updateUserProfile(userId, { status });
      toast({
        title: "Success",
        description: `User status updated to ${status}`
      });
      loadData();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleMakeCurrentUserAdmin = async () => {
    try {
      await makeCurrentUserAdmin();
      toast({
        title: "Success",
        description: "You are now an admin!"
      });
      loadData();
    } catch (error) {
      console.error("Error making current user admin:", error);
      toast({
        title: "Error",
        description: "Failed to grant admin privileges",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const isUserAdmin = (userId: string) => {
    return adminUsers.some(admin => admin.user_id === userId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need admin privileges to access user management.
            </p>
            <p className="text-sm text-muted-foreground">
              If you're setting up the system for the first time, click the button below to make yourself an admin.
            </p>
            <Button onClick={handleMakeCurrentUserAdmin} className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Make Me Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their access permissions</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {users.length} Users
          </Badge>
          <Badge variant="default" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {adminUsers.length} Admins
          </Badge>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((userProfile) => (
              <div
                key={userProfile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{userProfile.full_name || userProfile.email}</h3>
                    {isUserAdmin(userProfile.user_id) && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    <Badge variant={userProfile.status === 'active' ? 'default' : 'secondary'}>
                      {userProfile.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {userProfile.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserStatus(userProfile.user_id, 'inactive')}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateUserStatus(userProfile.user_id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                  
                  {isUserAdmin(userProfile.user_id) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAdmin(userProfile.user_id)}
                      disabled={userProfile.user_id === user?.id} // Prevent removing own admin
                    >
                      Remove Admin
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMakeAdmin(userProfile.user_id)}
                    >
                      Make Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
