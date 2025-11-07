import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  profilePic?: string | null;
}

export default function ProfileMenu({ profilePic }: ProfileMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleViewProfile = () => {
    if (user && user.id) {
      navigate(`/profile/${user.id}`);
    }
    handleClose();
  };

  return (
    <div>
      <div
        className="cursor-pointer flex items-center px-1 py-2 rounded-full transition-colors"
        onClick={handleClick}
      >
        <Avatar src={profilePic || undefined} sx={{ width: 34, height: 34 }} />
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 280,
            borderRadius: 2,
            boxShadow: 3,
            overflow: "visible",
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center space-x-2">
          <Avatar
            src={profilePic || undefined}
            sx={{ width: 48, height: 48 }}
            alt={user?.name || ""}
          />
          <div>
            <Typography variant="body1" className="font-semibold">
              {user?.name}
            </Typography>
          </div>
        </div>

        <div className="px-4 py-1 mb-1">
          <button
            onClick={handleViewProfile}
            className="w-full text-blue-700 border border-blue-700 rounded-full py-0.5 text-sm font-semibold hover:bg-blue-50 hover:border-blue-800 transition-colors"
          >
            View Profile
          </button>
        </div>

        <Divider sx={{ my: 0.5 }} />

        <Typography
          variant="caption"
          className="font-semibold text-gray-800 px-4 pt-2 pb-1 block"
        >
          Account
        </Typography>
        <MenuItem
          onClick={handleClose}
          sx={{ py: 0.5, px: 4, fontSize: "0.875rem" }}
        >
          Settings & Privacy
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ py: 0.5, px: 4, fontSize: "0.875rem" }}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </div>
  );
}
