import { Box } from '@mui/system';
import React, { FC, useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Card, Checkbox, IconButton, List, ListItem, ListItemButton, ListItemText, Pagination, TextField, Typography } from '@mui/material';


const RestaurantReview: FC<{q:string}> = ({q}) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [restaurants, setRestaurants] = useState<number[]>([]);
    const [storeName, setStoreName] = useState<any[]>([]);
    const [selectedStores, setSelectedStores] = useState<number[]>([]);
    const [numPages, setNumPages] = useState(0);
    const [contentUrl, setContentUrl] = useState(`http://localhost:8983/solr/restaurant_review/select?df=review_txt&facet.field=tag&facet.field=rating&facet.field=restaurant&facet.mincount=10&facet=true&hl.fl=review_txt&hl=true&q.op=OR&q=${q}`);
    const [page, setPage] = useState(1);
    const [facetTag, setFacetTag] = useState<{[key: string]: number}>({})
    const [facetRestaurant, setFacetRestaurant] = useState<{[key: number]: number}>({})
    const [facetRating, setFacetRating] = useState<{[key: number]: number}>({});
    const [selectedRating, setSelectedRating] = useState<any[]>([]);

    const handleSelectStore = (value: number) => () => {
  
        const currentIndex = selectedStores.indexOf(value);
        const newChecked = [...selectedStores];
        console.log(value, selectedStores, currentIndex);
        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }
        console.log(value, selectedStores, currentIndex, newChecked);
        setSelectedStores(newChecked);
        fetchReviewWithFacet(newChecked,selectedKeywords,selectedRating)
    }

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
        fetchReviewWithFacet(selectedStores,selectedKeywords,newChecked);
    };

    const handleSelectKeywords = (value: string) => () => {
        const currentIndex = selectedKeywords.indexOf(value);
        const newChecked = [...selectedKeywords];
    
        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }
        setSelectedKeywords(newChecked);
        fetchReviewWithFacet(selectedStores,newChecked,selectedRating);
    };


    const fetchReviewPage = (start: number) => {
        fetch(`${contentUrl}&start=${start}`)
        .then((res) => res.json())
        .then((res) => {
            console.log(res);
            if(res['response']!=undefined && res['response']['docs']!=undefined){
                setReviews(res['response']['docs'])
                setNumPages(Math.ceil(res['response']['numFound']/10));
            }
            
            if(res['facet_counts']!=undefined && res['facet_counts']['facet_fields']!=undefined){
                const cat: any[] = res['facet_counts']['facet_fields']['tag'];
                if(cat!=undefined){
                    let newTag: {[key: string]:number} = {}
                    cat.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newTag[cat[idx]] = cat[idx+1];
                        }
                    })
                    setFacetTag(newTag);
                }

                const rate: any[] = res['facet_counts']['facet_fields']['rating'];
                if(rate!=undefined){
                    let newRating: {[key: string]:number} = {}
                    rate.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newRating[rate[idx]] = rate[idx+1];
                        }
                    })
                    setFacetRating(newRating);
                }

                const restaurant: any[] = res['facet_counts']['facet_fields']['restaurant'];
                if(restaurant!=undefined){
                    let newStore: {[key: string]:number} = {}
                    restaurant.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newStore[restaurant[idx]] = rate[idx+1];
                        }
                    })
                    setFacetRestaurant(newStore);
                }
            }
        })
    }

    const fetchReviewWithFacet = (restaurants: number[], tags: string[], ratings: number[]) => {
        let url=`http://localhost:8983/solr/restaurant_review/query`

        let req_body:{query:string,filter:string[],facet:{[key:string]:any}} = {
            "query": q,
            "filter":[],
            "facet": {}
        }

        const filters = [];
        const facets: {[key: string]:any} = {};
        facets['tag'] = {
            "type":"terms",
            "field":"tag",
            "mincount":5,
            "limit":50    
        }
        facets['rating']={
            "type":"terms",
            "field":"rating",
            "limit":10
        }
        facets['restaurant']={
            "type":"terms",
            "field":"restaurant",
            "mincount":5,
            "limit":20
        }
        if(tags.length>0){
            filters.push(`{!tag=tag}tag:(${tags.join(' OR ')})`);   
            facets['tag']['domain'] = {"excludeTags":"tag"};     
        }
        if(ratings.length>0) {
            filters.push(`{!tag=rating}rating:(${ratings.join(' ')})`);   
            facets['rating']['domain'] = {"excludeTags":"rating"};        
        }
        if(restaurants.length>0) {
            filters.push(`{!tag=restaurant}restaurant:(${restaurants.join(' ')})`);   
            facets['restuarant']['domain'] = {"excludeTags":"restuarant"};        
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
                setReviews(res['response']['docs']);
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

            if(res['facets']!=undefined && res['facets']['tag']!=undefined){
                const rate: any[] = res['facets']['tag']['buckets']
                let newTag: {[key: number]:number} = {};
                rate.map((v, idx) => {
                    newTag[v['val']] = v['count']
                })
                setFacetTag(newTag);
            }

            if(res['facets']!=undefined && res['facets']['restaurant']!=undefined){
                const rate: any[] = res['facets']['restaurant']['buckets']
                let newStore: {[key: number]:number} = {};
                rate.map((v, idx) => {
                    newStore[v['val']] = v['count']
                })
                setFacetRestaurant(newStore);
            }
        })
    }

    const handlePageChange = (
        event: React.ChangeEvent<unknown>, 
        newPage: number
    ) => {
        setPage(newPage);
        fetchReviewPage((newPage-1)*10);
    };

    

    useEffect(() => {
        fetchReviewPage(0);
    },[q])

    useEffect(() => {
        if(Object.keys(facetRestaurant).length == 0){
            return
        }
        const ids = Object.keys(facetRestaurant)
        fetch(
            `http://localhost:8983/solr/restaurant_info/select?q=id:(${ids.join(' ')})&fl=name_en,name_jp,name_fr,id`
        )
        .then((res) => res.json())
        .then((res) => {
            if(res['response']!=undefined){
                const newNames: any[] = [];
                for(let doc of res['response']['docs']){
                    let name = doc['name_en']
                    if(doc['name_fr']!=undefined){
                        name = `${name} (${doc['name_fr']})`
                    }
                    if(doc['name_jp']!=undefined){
                        name = `${name} (${doc['name_jp']})`
                    }
                    newNames.push([name, doc['id']])
                }
                setStoreName(newNames);
                              
            }
        })

    },[facetRestaurant]);

    

    

    
    return (
        <>
            <Box
            sx={{width:"30vw", margin: "8px"}}>
                <Typography variant="body2">Filter By Date</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['DatePicker']}>
                    <DatePicker 
                    sx={{width:"20vw"}}
                    label="Start" />
                </DemoContainer>
                <DemoContainer components={['DatePicker']}>
                    <DatePicker 
                    sx={{width:"20vw"}}
                    label="End" />
                </DemoContainer>
                </LocalizationProvider>
                <Typography variant="body2">Filter By Keywords</Typography>
                <List dense sx={{ width: '100%', maxWidth: "25vw", bgcolor: 'background.paper' }}>
                    {
                        
                        facetTag!=undefined?
                        Object.keys(facetTag).map((ele: any, idx: number) => {
                          
                            return (
                                <ListItem 
                                dense sx={{height:"4vh"}}
                                key={ele}
                                secondaryAction={
                                    <Checkbox
                                      edge="end"
                                      onChange={handleSelectKeywords(ele)}
                                      checked={selectedKeywords.indexOf(ele) !== -1}
                                    />
                                }>
                                    <ListItemButton sx={{width: "25vw", paddingLeft: "5px"}}>
                                        <ListItemText 
                                        id={`${idx}`} 
                                        primary={`${ele} (${facetTag[ele]})`} />
                                    </ListItemButton>
                                </ListItem>
                            )
                            
                        }):<></>
                    }
                </List>
                <Typography variant="body2">Filter By Restaurant</Typography>
                <List dense sx={{ width: '100%', maxWidth: "25vw", bgcolor: 'background.paper' }}>
                { 
                    storeName.map((name) => {
                        const idx = Number(name[1])
                        return <ListItem 
                        dense sx={{height:"4vh"}}
                        key={name[1]}
                        secondaryAction={
                            <Checkbox
                              edge="end"
                              onChange={handleSelectStore(idx)}
                              checked={selectedStores.indexOf(idx) !== -1}
                            />
                        }>
                            <ListItemButton sx={{width: "25vw", paddingLeft: "5px"}}>
                                <ListItemText 
                                id={`${idx}`} 
                                primary={`${name[0]}(${facetRestaurant[name[1]]})`} />
                            </ListItemButton>
                        </ListItem>
                    }) 
                }
                </List>
                <Typography variant="body2">Filter By Rating</Typography>
                <List dense sx={{ width: '100%', maxWidth: "25vw", bgcolor: 'background.paper' }}>
                {
                    facetRating!=undefined?
                    Object.keys(facetRating).map((ele: any, idx: number) => {
                        return (
                            <ListItem 
                            dense sx={{height:"4vh"}}
                            key={ele}
                            secondaryAction={
                                <Checkbox
                                    edge="end"
                                    onChange={handleRatingSelect(ele)}
                                    checked={selectedRating.indexOf(ele) !== -1}
                                />
                            }>
                                <ListItemButton sx={{width: "25vw", paddingLeft: "5px"}}>
                                    <ListItemText 
                                    id={`${idx}`} 
                                    primary={`${ele} (${facetRating[ele]})`} />
                                </ListItemButton>
                            </ListItem>
                        )
                    }):<></>
                }</List>
            </Box>

            <Box
            sx={{
                width:"69vw", 
                height: "84vh", 
                top: "2vh", 
                right: '0', 
                position: 'absolute',
                overflow: 'scroll'}}>
                {   
                    reviews!=undefined?
                    reviews.map((review: any) => {
                        // console.log(review['restaurant'], selectedStores);
                        const date = review.review_date[0].slice(0,10)
                        return (
                            <Card sx={{ width: "65vw", margin: "2vw"}}>
                                <Typography variant="body1">{review.user_name}-rating={review.rating}-date={date}</Typography>
                                <Typography variant="body2">{review.user_loc}</Typography>
                                <Typography variant="caption">{review.review_txt}</Typography>
                            </Card>
                        )
                    }):<></>
                }
            </Box>
            <Box flexDirection={'column'} sx={{margin: "2px", height:'6vh', position:'absolute',right:'0',bottom:'0'}}>
                <Pagination 
                count={numPages} 
                page={page}
                onChange={handlePageChange}
                />
            </Box>

    
        </>
    )
}

export default RestaurantReview;