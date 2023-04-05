import React, { FC, useMemo, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvent, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Button, Card, CardContent, Checkbox, Chip, Dialog, IconButton, ListItem, ListItemButton, ListItemText, Pagination, Rating, TablePagination, Typography } from '@mui/material';
import L, { LatLng, LatLngExpression } from 'leaflet';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

let DefaultIcon = L.icon({
    iconUrl: `${process.env.PUBLIC_URL}/marker-icon.png`,
    shadowUrl: `${process.env.PUBLIC_URL}/marker-shadow.png`
});

L.Marker.prototype.options.icon = DefaultIcon;

const RestaurantInfo: FC<{q:string}> = ({q}) =>{
    const [data, setData] = useState<any[]>([]);
    const [numPages, setNumPages] = useState(0);
    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);
    const [contentUrl, setContentUrl] = useState(`http://localhost:8983/solr/restaurant_info/select?facet.field=category&facet.field=rating&facet=true&q.op=OR`);
    const [facetCategory, setFacetCategory] = useState<{[key: string]: number}>({})
    const [facetRating, setFacetRating] = useState<{[key: number]: number}>({});
    const [selectedKeywords, setSelectedKeywords] = useState<any[]>([]);
    const [selectedRating, setSelectedRating] = useState<any[]>([]);
    const [center, setCenter] = useState<LatLngExpression>([51.0, 19.0]);
    const [zoom, setZoom] = useState(2);

    const fetchRestaurant = (start: number) => {
        const url = `${contentUrl}&q=${q}&df=keywords&start=${start}`
        fetch(url)
        .then((res) => res.json())
        .then((res) => {
            if(res['response']!=undefined && res['response']['docs']!=undefined){
                setData(res['response']['docs']);
                setNumPages(Math.ceil(res['response']['numFound']/10));
                console.log(res);
                const latlon = res['response']['docs'][0]['address_latlon'].split(',')
                setCenter(latlon);
                setZoom(13);
            }

            if(res['facet_counts']!=undefined && res['facet_counts']['facet_fields']!=undefined){
                const cat: any[] = res['facet_counts']['facet_fields']['category'];
                if(cat!=undefined){
                    let newCategory: {[key: string]:number} = {}
                    cat.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newCategory[cat[idx]] = cat[idx+1];
                        }
                    })
                    setFacetCategory(newCategory);
                }

                const rate: any[] = res['facet_counts']['facet_fields']['rating'];
                if(rate!=undefined){
                    let newRating: {[key: string]:number} = {}
                    cat.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newRating[rate[idx]] = rate[idx+1];
                        }
                    })
                    setFacetRating(newRating);
                }
            }
        })
    }

    const handleKeywordSelect = (value: string) => () => {
        const currentIndex = selectedKeywords.indexOf(value);
        const newChecked = [...selectedKeywords];
    
        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }
        setSelectedKeywords(newChecked);
        fetchRestaurantWithFacet(newChecked,selectedRating);
    };

    const handleRatingSelect = (value: any) => () => {
        console.log(value, selectedRating);
        const currentIndex = selectedRating.indexOf(value);
        const newChecked = [...selectedRating];
    
        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }
        setSelectedRating(newChecked);
        fetchRestaurantWithFacet(selectedKeywords,newChecked);
    };

    const fetchRestaurantWithLatLng = (lat: number, lng: number) => {
        console.log('fetch restaurant with lat lng', lat, lng);
        const url = `http://localhost:8983/solr/restaurant_info/select?facet.field=category&facet.field=rating&facet=true&d=500&fq={!geofilt}&sfield=address_latlon&pt=${lat},${lng}&q=${q}&spatial=true&sort=geodist() asc`
        fetch(url)
        .then((res) => res.json())
        .then((res) => {
            if(res['response']!=undefined && res['response']['docs']!=undefined){
                setData(res['response']['docs']);
                setNumPages(Math.ceil(res['response']['numFound']/10));
                console.log(res);
            }
        })
        setContentUrl(url)
    }

    const fetchRestaurantWithFacet = (words: string[], ratings:number[]) => {
        let url=`http://localhost:8983/solr/restaurant_info/query`

        let req_body:{query:string,filter:string[],facet:{[key:string]:any}} = {
            "query": q,
            "filter":[],
            "facet": {}
        }
        const filters = [];
        const facets: {[key: string]:any} = {};
        facets['category'] = {
            "type":"terms",
            "field":"category",
            "limit":50    
        }
        facets['rating']={
            "type":"terms",
            "field":"rating",
            "limit":10
        }
        if(words.length>0){
            filters.push(`{!tag=category}category:(${words.join(' OR ')})`);   
            facets['category']['domain'] = {"excludeTags":"category"};     
        }
        if(ratings.length>0) {
            filters.push(`{!tag=rating}rating:(${ratings.join(' ')})`);   
            facets['rating']['domain'] = {"excludeTags":"rating"};        
        }
        
        req_body['filter'] = filters
        req_body['facet'] = facets

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req_body)
        })
        .then((res)=>res.json())
        .then((res)=>{
            if(res['response']!=undefined && res['response']['docs']!=undefined){
                setData(res['response']['docs']);
                setNumPages(Math.ceil(res['response']['numFound']/10));
                console.log(res);
            }

            if(res['facets']!=undefined && res['facets']['rating']!=undefined){
                const rate: any[] = res['facets']['rating']['buckets']
                let newRating: {[key: number]:number} = {};
                rate.map((v, idx) => {
                    newRating[v['val']] = v['count']
                })
                setFacetRating(newRating);
            }

            if(res['facets']!=undefined && res['facets']['category']!=undefined){
                const rate: any[] = res['facets']['category']['buckets']
                let newCategory: {[key: number]:number} = {};
                rate.map((v, idx) => {
                    newCategory[v['val']] = v['count']
                })
                setFacetCategory(newCategory);
            }
        })
        
    }

    useEffect(() => {
        fetchRestaurant(0);
    },[q]);


    const handlePageChange = (
        event: React.ChangeEvent<unknown>, 
        newPage: number
    ) => {
        setPage(newPage);
        fetchRestaurant((newPage-1)*10);
    }
    

    const info_list = useMemo(() => {
        return data.map((info) => {
            return (
            <Card sx={{ width: "27vw"}} key={info['id']}>
                <CardContent>
                    <Typography variant="h5" component="div">
                        {info.name_en? info.name_en: info.name_fr}
                    </Typography>
                    <Rating value={info.rating} readOnly size="small"/>
                    <Typography variant="caption" component="div">
                        {info.address}
                    </Typography>
                    {
                        info.category.map((cat: string)=>(
                            <Chip sx={{marginTop: "4px", marginRight: "2px"}} size="small" color="info" label={cat}/>
                        ))
                    }
                </CardContent>
            </Card>
            )
        })
    }, [data])

    const MapEvents = () => {
        useMapEvents({
          click(e) {
            fetchRestaurantWithLatLng(e.latlng.lat, e.latlng.lng)
          },
        });
        return null;
    }

    const ChangeView: FC<{center:LatLngExpression, zoom:number}> = ({ center, zoom }) => {
        console.log(center)
        const map = useMap();
        map.setView(center, zoom);
        return null;
    }

    return (
        <>
            <Box sx={{margin: "5px", height:'83vh',overflow:'scroll'}}>
                {info_list}
            </Box>
            <Box flexDirection={'column'} sx={{margin: "2px", height:'6vh', position:'absolute',left:'0',bottom:'0'}}>
                <Pagination 
                count={numPages} 
                page={page}
                onChange={handlePageChange}
                />
                <IconButton onClick={()=>{setShowFilter(true)}}>
                    <FilterAltIcon/>
                </IconButton>
            </Box>
            <MapContainer
            className="markercluster-map"
            style={{height: '92vh', width: "70vw", bottom: "0", right: "0", position:'absolute'}}
            center={center}
            zoom={zoom}
            minZoom={2}
            maxZoom={18}
            >
                <TileLayer
                    noWrap={true}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                {
                    data.map((x) => {
                        const pos = x['address_latlon'].split(',');
                        return (
                        <Marker key={x['id']} position={pos} icon={DefaultIcon}>
                            <Popup>
                                {x['name_en']}
                            </Popup>
                       </Marker>
                       )
                    })
                }
                <MapEvents />
                <ChangeView center={center} zoom={zoom} /> 
                {
                    showFilter?
                    <Dialog 
                    open={showFilter} 
                    onClose={()=>{
                        setShowFilter(false);
                    }}>
                        <Box sx={{maxWidth:"50vw"}}>
                            <Typography variant="body2">Filter By Rating</Typography>
                            <Box sx={{maxWidth:"50vw", maxHeight:'30vh',overflow:'scroll'}}>
                            {
                                facetRating!=undefined?
                                Object.keys(facetRating).map((ele: any, idx: number) => {
                                    return (
                                        <ListItem 
                                        dense sx={{height:"3vh"}}
                                        key={ele}
                                        secondaryAction={
                                            <Checkbox
                                              edge="end"
                                              onChange={handleRatingSelect(ele)}
                                              checked={selectedRating.indexOf(ele) !== -1}
                                            />
                                        }>
                                            <ListItemButton sx={{width: "20vw"}}>
                                                <ListItemText 
                                                id={`${idx}`} 
                                                primary={`${ele} (${facetRating[ele]})`} />
                                            </ListItemButton>
                                        </ListItem>
                                    )
                                }):<></>
                            }
                            
                            </Box>
                            <Typography variant="body2">Filter By Category</Typography>
                            <Box sx={{maxWidth:"50vw", maxHeight:'50vh',overflow:'scroll'}}>
                            {
                                facetCategory!=undefined ?
                                Object.keys(facetCategory).map((ele: any, idx: number) => {
                                    return (
                                        <ListItem 
                                        key={ele}
                                        dense sx={{height:"3vh"}}
                                        secondaryAction={
                                            <Checkbox
                                              edge="end"
                                              onChange={handleKeywordSelect(ele)}
                                              checked={selectedKeywords.indexOf(ele) !== -1}
                                            />
                                        }>
                                            <ListItemButton sx={{width: "20vw"}}>
                                                <ListItemText 
                                                id={`${idx}`} 
                                                primary={`${ele} (${facetCategory[ele]})`} />
                                            </ListItemButton>
                                        </ListItem>
                                        )    
                                }):<></>
                            }</Box>
                            
                        </Box>
                    </Dialog>:<></>
                }
                
            </MapContainer>
        </>
        
    )
}

export default RestaurantInfo;