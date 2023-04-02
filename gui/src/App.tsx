import './App.css';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, ListItem, Menu, MenuItem, TextField } from '@mui/material';
import RestaurantInfo from './RestaurantInfo';
import RestaurantReview from './RestaurantReview';
import useDebounce from './debounce';

function App() {

  // const Search = styled('div')(({ theme }) => ({
  //   position: 'relative',
  //   borderRadius: theme.shape.borderRadius,
  //   backgroundColor: alpha(theme.palette.common.white, 0.15),
  //   '&:hover': {
  //     backgroundColor: alpha(theme.palette.common.white, 0.25),
  //   },
  //   marginRight: theme.spacing(2),
  //   marginLeft: 0,
  //   width: '100%',
  //   [theme.breakpoints.up('sm')]: {
  //     marginLeft: theme.spacing(3),
  //     width: 'auto',
  //   },
  // }));

  // const StyledInputBase = styled(InputBase)(({ theme }) => ({
  //   color: 'inherit',
  //   '& .MuiInputBase-input': {
  //     padding: theme.spacing(1, 1, 1, 0),
  //     // vertical padding + font size from searchIcon
  //     paddingLeft: '2em',
  //     transition: theme.transitions.create('width'),
  //     width: '100%',
  //     [theme.breakpoints.up('md')]: {
  //       width: '20ch',
  //     },
  //   },
  // }));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // const suggestRef = useRef();
  const [suggestAnchor, setSuggestAnchor] = React.useState<null | HTMLElement>(null);
  const [page, setPage] = React.useState('')
  const [q, setQ] = React.useState('');
  const open = Boolean(anchorEl);
  const debouncedQ = useDebounce<string>(q, 800);
  const [suggest, setSuggest] = React.useState<string[]>([])
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQ, setSearchQ] = useState('*:*');
  const [url, setUrl] = useState('');
  const [loc, setLoc] = useState('');
  const [numStore, setNumStore] = useState(1);
  const [numReview, setNumReview] = useState(1);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  useEffect(() => {
    if(page==''){
      return
    }
    console.log(page)
    let suggester = 'suggest.dictionary=suggest_fuzzy&suggest.dictionary=suggest_infix';
    if(page == 'info'){
      suggester = 'suggest.dictionary=mySuggester';
    }
    const url =  `http://localhost:8983/solr/restaurant_${page}/suggest?q.op=OR&q=${q}&suggest.build=true&suggest.collate=true&${suggester}&suggest=true`
    fetch(url)
    .then((res) => res.json())
    .then((res) => {
      console.log(res['suggest'],res['suggest']["mySuggester"])

      const newSuggest: string[] = [];
      if(res['suggest']!=undefined &&res['suggest']["suggest_infix"]!=undefined&&res['suggest']["suggest_infix"][q]!=undefined){
        const suggestions = res['suggest']["suggest_infix"][q]['suggestions'];
        suggestions.map((v: any, idx: number) => {
          newSuggest.push(v['term']);
        })
      }

      if(res['suggest']!=undefined &&res['suggest']["suggest_fuzzy"]!=undefined&&res['suggest']["suggest_fuzzy"][q]!=undefined){
        const suggestions = res['suggest']["suggest_fuzzy"][q]['suggestions'];
        suggestions.map((v: any, idx: number) => {
          const term = v['term']
          if(newSuggest.filter((x: string)=>x.replace('<b>','').replace('</b>','') == term).length == 0){
            newSuggest.push(term);
          }
          
        })
      }
      setSuggest(newSuggest);

    })
  }, [debouncedQ]);

  return (
    <div>
      <AppBar color="transparent" position="sticky">
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
          <Box
            sx={{ width: '30%'}}
          >
            <TextField 
            disabled={page==''}
            size='small'
            placeholder="Search…" 
            id="search-input" 
            value={q}
            onChange={(event: React.ChangeEvent<HTMLInputElement>)=>{
              if(suggestAnchor==undefined){
                setSuggestAnchor(event.currentTarget);
              }
              setQ(event.target.value);
            }}/>
            <Button disabled={page==''} 
            sx={{margin:'5px'}} 
            variant="outlined" 
            onClick={()=>{
              console.log(q);
              setSearchQ(q);
            }}>Search</Button>
          </Box>
          
          <Button variant="outlined" onClick={()=>{setOpenDialog(true)}}>Add Data</Button>

          <Menu
          id='suggest-menu'
          open={suggest.length>0}
          anchorEl={suggestAnchor}
          onClose={()=>{ setSuggest([]); }}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
          >
            {
              suggest.map((x, id) => (
                <MenuItem
                id={`${id}`} value={x} 
                onClick={() => {
                  setSuggest([]);
                  setQ(x);
                }}>{x}</MenuItem>
              ))
            }
          </Menu>

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
      <Dialog 
      open={openDialog}
      onClose={()=>{
        setOpenDialog(false);
      }}>
        <DialogTitle>Incremental Indexing</DialogTitle>
        <DialogContent>
          <div>
          <TextField 
          sx={{width:"100%", marginTop:"10px"}}
          label="Location"
          value={loc}
          onChange={(e)=>{ setLoc(e.target.value) }}
          size="small"/>

          <TextField 
          sx={{width:"100%", marginTop:"10px"}}
          value={url}
          onChange={(e)=>{ setUrl(e.target.value) }}
          label="Restaurant URL"
          size="small"/>

          <TextField
          sx={{width:"100%", marginTop:"10px"}}
          label="Number of Restaurants"
          type="number"
          value={numStore}
          onChange={(e)=>{ setNumStore(Number(e.target.value)) }}
          InputProps={{
            inputProps: { min: 0, max:10 }
          }}
          size="small" />

          <TextField
          sx={{width:"100%", marginTop:"10px"}}
          label="Number of Reviews"
          type="number"
          value={numReview}
          onChange={(e)=>{ setNumReview(Number(e.target.value)) }}
          InputProps={{
            inputProps: { min: 0, max:50 }
          }}
          size="small" /> 
          <Button onClick={()=>{}}>Go</Button>
        </div>
        </DialogContent>

      </Dialog>
      {
        page == 'info' ? <RestaurantInfo q={searchQ}/>: 
        page == 'review'?<RestaurantReview q={searchQ}/>:<></>
      }
    </div>
  );
}

export default App;
