import "./App.css";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  ListItem,
  Menu,
  MenuItem,
  TextField,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import RestaurantInfo from "./RestaurantInfo";
import RestaurantReview from "./RestaurantReview";
import useDebounce from "./debounce";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

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
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // const suggestRef = useRef();
  const [suggestAnchor, setSuggestAnchor] = React.useState<null | HTMLElement>(
    null
  );
  const [page, setPage] = React.useState("");
  const [q, setQ] = React.useState("");
  const open = Boolean(anchorEl);
  const debouncedQ = useDebounce<string>(q, 800);
  const [suggest, setSuggest] = React.useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQ, setSearchQ] = useState("*:*");
  const [url, setUrl] = useState("");
  const [loc, setLoc] = useState("");
  const [numStore, setNumStore] = useState(1);
  const [numReview, setNumReview] = useState(1);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const url = `http://localhost:8983/solr/restaurant_info/suggest?q.op=OR&q=${q}&suggest.build=true&suggest.collate=true&suggest.dictionary=mySuggester&suggest=true`;
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        console.log(res["suggest"], res["suggest"]["mySuggester"]);

        if (
          res["suggest"] != undefined &&
          res["suggest"]["mySuggester"] &&
          res["suggest"]["mySuggester"][q] != undefined
        ) {
          const suggestions = res["suggest"]["mySuggester"][q]["suggestions"];
          const newSuggest: string[] = [];
          suggestions.map((v: any, idx: number) => {
            newSuggest.push(v["term"]);
          });
          console.log(newSuggest);
          setSuggest(newSuggest);
        }
      });
  }, [debouncedQ]);

  return (
    <div style={{ backgroundColor: "cornsilk", height: 275 }}>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Yelp_Logo.svg/1280px-Yelp_Logo.svg.png"
        alt=""
        width="480"
        height="194"
        className="center"
      />
      <h1>Restaurant Finder</h1>

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="Search Selection"
          >
            <Tab label="Search Restaurants" {...a11yProps(0)} />
            <Tab label="Search Reviews" {...a11yProps(1)} />
            <Tab label="Add Data" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          Restaurants
          <Box sx={{ width: "30%", textAlign: "center" }}>
            <TextField
              //disabled={page == ""}
              size="small"
              placeholder="Search…"
              id="search-input"
              value={q}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (suggestAnchor == undefined) {
                  setSuggestAnchor(event.currentTarget);
                }
                setQ(event.target.value);
              }}
            />
            <Button
              //disabled={page == ""}
              sx={{ margin: "5px" }}
              variant="outlined"
              onClick={() => {
                setSearchQ(q);
              }}
            >
              Search Restaurants
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={1}>
          Reviews
          <Box sx={{ width: "30%", textAlign: "center" }}>
            <TextField
              //disabled={page == ""}
              size="small"
              placeholder="Search…"
              id="search-input"
              value={q}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (suggestAnchor == undefined) {
                  setSuggestAnchor(event.currentTarget);
                }
                setQ(event.target.value);
              }}
            />
            <Button
              //disabled={page == ""}
              sx={{ margin: "5px" }}
              variant="outlined"
              onClick={() => {
                setSearchQ(q);
              }}
            >
              Search Reviews
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenDialog(true);
            }}
          >
            Add Data
          </Button>
        </TabPanel>
      </Box>

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
            <SearchRoundedIcon /> Select this first
          </IconButton>

          <Box sx={{ width: "30%", textAlign: "center" }}>
            <TextField
              disabled={page == ""}
              size="small"
              placeholder="Search…"
              id="search-input"
              value={q}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (suggestAnchor == undefined) {
                  setSuggestAnchor(event.currentTarget);
                }
                setQ(event.target.value);
              }}
            />
            <Button
              disabled={page == ""}
              sx={{ margin: "5px" }}
              variant="outlined"
              onClick={() => {
                setSearchQ(q);
              }}
            >
              Search
            </Button>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              setOpenDialog(true);
            }}
          >
            Add Data
          </Button>

          <Menu
            id="suggest-menu"
            open={suggest.length > 0}
            anchorEl={suggestAnchor}
            onClose={() => {
              setSuggest([]);
            }}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            {suggest.map((x, id) => (
              <MenuItem
                id={`${id}`}
                value={x}
                onClick={() => {
                  setSuggest([]);
                  setQ(x);
                }}
              >
                {x}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setPage("info");
              }}
            >
              Search Restaurants
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setPage("review");
              }}
            >
              Search Reviews
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
        }}
      >
        <DialogTitle>Incremental Indexing</DialogTitle>
        <DialogContent>
          <div>
            <TextField
              sx={{ width: "100%", marginTop: "10px" }}
              label="Location"
              value={loc}
              onChange={(e) => {
                setLoc(e.target.value);
              }}
              size="small"
            />

            <TextField
              sx={{ width: "100%", marginTop: "10px" }}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
              }}
              label="Restaurant URL"
              size="small"
            />

            <TextField
              sx={{ width: "100%", marginTop: "10px" }}
              label="Number of Restaurants"
              type="number"
              value={numStore}
              onChange={(e) => {
                setNumStore(Number(e.target.value));
              }}
              InputProps={{
                inputProps: { min: 0, max: 10 },
              }}
              size="small"
            />

            <TextField
              sx={{ width: "100%", marginTop: "10px" }}
              label="Number of Reviews"
              type="number"
              value={numReview}
              onChange={(e) => {
                setNumReview(Number(e.target.value));
              }}
              InputProps={{
                inputProps: { min: 0, max: 50 },
              }}
              size="small"
            />
            <Button onClick={() => {}}>Go</Button>
          </div>
        </DialogContent>
      </Dialog>
      {page == "info" ? (
        <RestaurantInfo q={searchQ} />
      ) : page == "review" ? (
        <RestaurantReview q={searchQ} />
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
