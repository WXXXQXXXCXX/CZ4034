import './App.css';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import RestaurantInfo from './RestaurantInfo';
import RestaurantReview from './RestaurantReview';

function App() {

  const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  }));

  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: '2em',
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: '20ch',
      },
    },
  }));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [page, setPage] = React.useState('')
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AppBar color="primary" position="sticky">
        <Toolbar variant="dense">
          <IconButton
            size="small"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleOpenMenu}
            sx={{ mr: 2 }}
          >
            <SearchRoundedIcon />
          </IconButton>
          <Search>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={()=>{
              setAnchorEl(null); 
              setPage('info')
            }}>Search Restaurants</MenuItem>
            <MenuItem onClick={()=>{
              setAnchorEl(null); 
              setPage('review')
            }}>Search Reviews</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {
        page == 'info' ? <RestaurantInfo />: 
        page == 'review'?<RestaurantReview />:<></>
      }
    </div>
  );
}

export default App;
