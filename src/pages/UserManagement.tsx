
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Search, Crown, AlertCircle } from "lucide-react";
import { UserProfile, AdminUser, UserRole } from "@/types/user";
import {
  fetchUserProfiles,
  updateUserProfile,
  updateUserRole,
  fetchAdminUsers,
  makeUserAdmin,
  removeUserAdmin,
  makeCurrentUserAdmin,
  checkHasAdminPermissions,
  checkAdminExists
} from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";
import AddUserDialog from "@/components/AddUserDialog";

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasAdminPermissions, setHasAdminPermissions] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      const [userProfiles, admins, adminPermissions, adminExistsStatus] = await Promise.all([
        fetchUserProfiles().catch(() => []),
        fetchAdminUsers().catch(() => []),
        checkHasAdminPermissions().catch(() => false),
        checkAdminExists().catch(() => false)
      ]);
      
      setUsers(userProfiles);
      setAdminUsers(admins);
      setHasAdminPermissions(adminPermissions);
      setAdminExists(adminExistsStatus);
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
  }, [user]);

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

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      toast({
        title: "Success",
        description: `User role updated to ${role}`
      });
      loadData();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleBootstrapAdmin = async () => {
    try {
      setBootstrapping(true);
      await makeCurrentUserAdmin();
      toast({
        title: "Success",
        description: "You are now the first admin!"
      });
      loadData();
    } catch (error) {
      console.error("Error bootstrapping admin:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to grant admin privileges",
        variant: "destructive"
      });
    } finally {
      setBootstrapping(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const isUserAdmin = (userId: string) => {
    return adminUsers.some(admin => admin.user_id === userId);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'admin': return 'outline';
      default: return 'secondary';
    }
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

  if (!user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please log in to access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAdminPermissions && adminExists) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need admin privileges to access user management. Contact an existing admin to grant you access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAdminPermissions && !adminExists) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Setup First Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No admin users exist in the system yet. As the first user, you can make yourself an admin to get started.
            </p>
            <Button 
              onClick={handleBootstrapAdmin} 
              className="flex items-center gap-2"
              disabled={bootstrapping}
            >
              <Crown className="h-4 w-4" />
              {bootstrapping ? "Setting up..." : "Become First Admin"}
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
          <AddUserDialog onUserAdded={loadData} />
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
                    <Badge variant={getRoleBadgeVariant(userProfile.user_role)}>
                      {userProfile.user_role}
                    </Badge>
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
                  <Select 
                    value={userProfile.user_role} 
                    onValueChange={(role: UserRole) => handleUpdateUserRole(userProfile.user_id, role)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  
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
                      disabled={userProfile.user_id === user?.id}
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
