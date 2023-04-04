import './App.css';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, InputLabel, ListItem, Menu, MenuItem, OutlinedInput, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import RestaurantInfo from './RestaurantInfo';
import RestaurantReview from './RestaurantReview';
import useDebounce from './debounce';

function App() {

  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // const suggestRef = useRef();
  const [suggestAnchor, setSuggestAnchor] = React.useState<null | HTMLElement>(null);
  const [page, setPage] = React.useState('')
  const [q, setQ] = React.useState('');
  const open = Boolean(anchorEl);
  const debouncedQ = useDebounce<string>(q, 400);
  const [suggest, setSuggest] = React.useState<string[]>([])
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQ, setSearchQ] = useState('*:*');
  const [url, setUrl] = useState('');
  const [loc, setLoc] = useState('');
  const [numStore, setNumStore] = useState(1);
  const [numReview, setNumReview] = useState(1);
  const [openPolarity, setOpenPolarity] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [sentence, setSentence] = useState('');

  const [polarityData, setPolarityData] = useState<any[]>([{
    review: "This restaurant is good, i will definitely come back again!!",
    lstm: 1,
    bert: 1,
    label: 1,
    logistic: 1,
    ensemble: 1
  }]);
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
          console.log(v['term'], v['term'].replaceAll('<b>','').replaceAll('</b>',''))
          newSuggest.push(v['term'].replaceAll('<b>','').replaceAll('</b>',''));
        })
      }

      if(res['suggest']!=undefined &&res['suggest']["suggest_fuzzy"]!=undefined&&res['suggest']["suggest_fuzzy"][q]!=undefined){
        const suggestions = res['suggest']["suggest_fuzzy"][q]['suggestions'];
        suggestions.map((v: any, idx: number) => {
          const term = v['term']
          if(newSuggest.filter((x: string)=>x.replaceAll('<b>','').replaceAll('</b>','') == term).length == 0){
            console.log(term, term.replaceAll('<b>','').replaceAll('</b>',''))
            newSuggest.push(term.replaceAll('<b>','').replaceAll('</b>',''));
          }
          
        })
      }
      console.log(newSuggest);
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
            sx={{ width: 'max-content'}}
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
              if(q === ''){
                setSearchQ('*:*');
              } else{
                setSearchQ(q);
              }
            }}>Search</Button>
          </Box>
          
          <Button variant="outlined" onClick={()=>{setOpenDialog(true)}}>Add Data</Button>
          <Button variant="outlined" sx={{marginLeft: '5px'}} onClick={()=>{setOpenPolarity(true)}}>Sentiment</Button>

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
          <Button onClick={()=>{
            console.log(numStore, numReview, loc, url);
            fetch('http://localhost:5000/update', {
              method: "POST",
              body: JSON.stringify({
                location: loc,
                url: url,
                num_restaurants: numStore,
                num_reviews: numReview,
              })
            })
            .then((res) => res.json())
            .then((res) => {
              console.log(res)
            })
          }}>Go</Button>
        </div>
        </DialogContent>

      </Dialog>

      <Dialog
      open={openPolarity}
      
      fullScreen>
        <AppBar sx={{ position: 'relative' }} color='transparent'>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={()=>{setOpenPolarity(false)}}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <TableContainer 
        component={Paper}
        sx={{ width: '69%', marginTop: '1%'}}>
          <Table sx={{ width: '100%'}} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{width:"60%"}}>Review</TableCell>
                <TableCell sx={{width:"8%"}} align="right">Label</TableCell>
                <TableCell sx={{width:"8%"}} align="right">Logistic</TableCell>
                <TableCell sx={{width:"8%"}} align="right">LSTM</TableCell>
                <TableCell sx={{width:"8%"}} align="right">BERT</TableCell>
                <TableCell sx={{width:"8%"}} align="right">Ensemble</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                polarityData.map((x, id) => {
                  return (
                    <TableRow 
                    key={`table-row${id}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{width:"60%"}}>{x.review}</TableCell>
                      <TableCell sx={{width:"8%"}} align="right">{x.label}</TableCell>
                      <TableCell sx={{width:"8%"}} align="right">{x.logistic}</TableCell>
                      <TableCell sx={{width:"8%"}} align="right">{x.lstm}</TableCell>
                      <TableCell sx={{width:"8%"}} align="right">{x.bert}</TableCell>
                      <TableCell sx={{width:"8%"}} align="right">{x.ensemble}</TableCell>
                    </TableRow>
                  )
                })
              }
            </TableBody>
          </Table>
        </TableContainer>
        <Box 
        sx={{
          width: "30%",
          position: 'absolute',
          top: "18%",
          right: '0',
        }} 
        flexDirection="column">
          <FormControl sx={{ width:'100%'}}>
            <InputLabel>Model</InputLabel>
            <Select
            value={selectedModels}
            onChange={(e)=>{
              const value = e.target.value;
              setSelectedModels(typeof value === 'string' ? value.split(',') : value);
            }}
            multiple
            input={<OutlinedInput label="Model" />}>
              <MenuItem key={'lstm'} value={'lstm'}>LSTM</MenuItem>
              <MenuItem key={'logistic'} value={'logistic'}>Logistic</MenuItem>
              <MenuItem key={'bert'} value={'bert'}>BERT</MenuItem>
              <MenuItem key={'ensemble'} value={'ensemble'}>Ensemble</MenuItem>
            </Select>
          </FormControl>
          <TextField 
          sx={{width:'100%'}}
          multiline
          value={sentence}
          onChange={(e)=>{setSentence(e.target.value)}}
          variant="standard"
          rows={5}
          placeholder='Input a sentence for classification'/>
          <Button>Go</Button>
          


        </Box>

      </Dialog>
      {
        page == 'info' ? <RestaurantInfo q={searchQ}/>: 
        page == 'review'?<RestaurantReview q={searchQ}/>:<></>
      }
    </div>
  );
}

export default App;
