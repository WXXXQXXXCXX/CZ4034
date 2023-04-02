import { Box } from '@mui/system';
import React, { FC, useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Card, Checkbox, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Pagination, Rating, TextField, Typography } from '@mui/material';



const RestaurantReview: FC<{q:string}> = ({q}) => {
    const baseUrl = 'http://localhost:8983/solr/restaurant_review';
    const [reviews, setReviews] = useState<any[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [storeName, setStoreName] = useState<any[]>([]);
    const [selectedStores, setSelectedStores] = useState<number[]>([]);
    const [numPages, setNumPages] = useState(0);
    const [contentUrl, setContentUrl] = useState(`http://localhost:8983/solr/restaurant_review/select?df=review_txt&facet.field=tag`);
    const [queryJson, setQueryJson] = useState<any>();
    const [page, setPage] = useState(1);
    const [facetTag, setFacetTag] = useState<{[key: string]: number}>({})
    const [facetRestaurant, setFacetRestaurant] = useState<{[key: number]: number}>({})
    const [facetRating, setFacetRating] = useState<{[key: number]: number}>({});
    const [selectedRating, setSelectedRating] = useState<any[]>([]);
    const [facetDate, setFacetDate] = useState<{[key: string]: number}>({});
    const [selectedDate, setSelectedDate] = useState<any[]>([]);
    const [highlighting, setHighlighting] = useState<{[key: string]: any}>({});

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
        fetchReviewWithFacet(newChecked,selectedKeywords,selectedRating,selectedDate)
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
        fetchReviewWithFacet(selectedStores,selectedKeywords,newChecked, selectedDate);
    };

    const handleDateSelect = (value: any) => () => {
        console.log(value, selectedDate);
        const currentIndex = selectedDate.indexOf(value);
        const newChecked = [...selectedDate];
    
        if (currentIndex === -1) {
          newChecked.push(value);
        } else {
          newChecked.splice(currentIndex, 1);
        }
        setSelectedDate(newChecked);
        fetchReviewWithFacet(selectedStores,selectedKeywords,selectedRating, newChecked);
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
        fetchReviewWithFacet(selectedStores,newChecked,selectedRating, selectedDate);
    };

    const highlight = (txt:string)  => {
        const parts = txt.split(new RegExp('</?em>'));
        return (
            <Box sx={{ width: "95%", margin: "5px"}}>
                <Typography variant='caption'>
                { 
                    parts.map((part, i) => 
                        <span 
                        key={i} 
                        style={ i%2 == 1? { fontWeight: 'bold' } : {} }
                        >
                            { part }
                        </span>
                    )
                }
                </Typography>
            </Box>
        )

    }


    const fetchReviewPage = (start: number) => {
        console.log('fetch review, ', contentUrl);
        let url = `${baseUrl}/select?df=review_txt&q=${q}&hl.fl=review_txt&hl=true`
        let query_params: RequestInit = {};
        if(queryJson==undefined){
            query_params.method = "GET";
            const f_date = 'facet.range=review_date&f.review_date.facet.range.start=NOW/DAY-10YEARS&f.review_date.facet.range.end=NOW/DAY&f.review_date.facet.range.gap=%2B1YEAR'
            url = `${url}&facet=true&facet.field=rating&facet.field=restaurant&facet.field=tag&${f_date}&start=${start}&f.tag.facet.mincount=5`
        } else {
            query_params.method = "POST"
            query_params.body = JSON.stringify(queryJson)
        }
        query_params.headers = {'Content-Type': 'application/json'}
        
        fetch(url, query_params)
        .then((res) => res.json())
        .then((res) => {
            console.log(res);
            if(res['response']!=undefined && res['response']['docs']!=undefined){
                console.log(res['highlighting'])
                if(res['highlighting']!=undefined){
                    const new_reviews: any[] = []
                    for(let review of res['response']['docs']){
                        const id = review['id']
                        let txt:string = review['review_txt']
                        console.log(id,res['highlighting'][id])
                        if(res['highlighting'][id]!=undefined && 
                            res['highlighting'][id]['review_txt']!=undefined){
                            const highlight_sents = res['highlighting'][id]['review_txt'].map(
                                (x: string)=>x.replaceAll('<em>','').replaceAll('</em>','')
                            );
                            console.log(highlight_sents);
                            for(let sent of highlight_sents){
                                txt = txt.replace(sent,`<em>${sent}</em>`);
                            }
                            review['review_txt'] = txt;
                        }
             
                        new_reviews.push(review)
                    }
                    console.log(new_reviews);
                    setReviews(new_reviews);
                } else{
                    setReviews(res['response']['docs'])
                } 
                // setReviews(res['response']['docs'])
                setNumPages(Math.ceil(res['response']['numFound']/10));
            }

            if(res['highlighting']!=undefined){
                setHighlighting(res['highlighting'])
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
            if(res['facet_counts']!=undefined && res['facet_counts']['facet_ranges']!=undefined){
                const dates: any[] = res['facet_counts']['facet_ranges']['review_date']['counts'];
                if(dates!=undefined){
                    let newDates: {[key: string]:number} = {}
                    dates.forEach((v: any, idx:number)=>{
                        if(idx%2==0){
                            newDates[dates[idx]] = dates[idx+1];
                        }
                    })
                    setFacetDate(newDates);
                }
            }
        })
    }

    const facet = useMemo(() => {

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
            "mincount":1,
            "limit":5
        }
        facets['date']={
            'type':"range",
            'field': "review_date",
            "min_count":1,
            "start": "NOW/DAY-10YEARS",
            "end":"NOW/DAY",
            "gap":"+1YEAR"
        }
        return facets

    }, [])

    const fetchReviewWithFacet = (restaurants: number[], tags: string[], ratings: number[], years: string[]) => {
        let url=`http://localhost:8983/solr/restaurant_review/select?q=${q}`

        const filters = [];
        // const facets: {[key: string]:any} = {};
        // facets['tag'] = {
        //     "type":"terms",
        //     "field":"tag",
        //     "mincount":5,
        //     "limit":50    
        // }
        // facets['rating']={
        //     "type":"terms",
        //     "field":"rating",
        //     "limit":10
        // }
        // facets['restaurant']={
        //     "type":"terms",
        //     "field":"restaurant",
        //     "mincount":1,
        //     "limit":5
        // }
        const facets = facet;
        if(tags.length>0){
            const words = []
            for(let word of tags){
            
                words.push(`(${word.replace('\x1F', "*")})`)
            }
            console.log(url, words)
            // url = `${url}&fq={!tag=tag}tag:(${words.join(' OR ')})`
            filters.push(`{!tag=tag}tag:(${words.join(' OR ')})`);   
            facets['tag']['domain'] = {"excludeTags":"tag"};     
        }
        if(ratings.length>0) {
            //url = `${url}&fq={!tag=rating}rating:(${ratings.join(' ')})`
            filters.push(`{!tag=rating}rating:(${ratings.join(' ')})`);   
            facets['rating']['domain'] = {"excludeTags":"rating"};        
        }
        if(restaurants.length>0) {
            //url = `${url}&fq={!tag=restaurant}{!tag=restaurant}restaurant:(${restaurants.join(' ')})`
            filters.push(`{!tag=restaurant}restaurant:(${restaurants.join(' ')})`);   
            facets['restaurant']['domain'] = {"excludeTags":"restaurant"};        
        }
        if(years.length>0){
            
            const date_filters = selectedDate.map((x)=>`[${Number(x.slice(0,4))} TO ${Number(x.slice(0,4))+1}]`)
            //url = `${url}&fq={!tag=review_date}{!tag=restaurant}review_date:(${date_filters.join(' OR ')}})`
            filters.push(`{!tag=review_date}review_date:(${date_filters.join(' OR ')}})`)
            facets['review_date']['domain'] = {"excludeTags":"review_date"}; 
        }
        
        
        let req_body: {[key:string]:any} = {};
        req_body['facet'] = facets;
        req_body['filter'] = filters;
        setQueryJson(req_body);
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req_body),
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

            if(res['facets']!=undefined && res['facets']['review_date']!=undefined){
                const rate: any[] = res['facets']['review_date']['buckets']
                let newDates: {[key: string]:number} = {};
                rate.map((v, idx) => {
                    newDates[v['val']] = v['count']
                })
                setFacetDate(newDates);
            }

            if(res['facets']!=undefined && res['facets']['restaurant']!=undefined){
                const rate: any[] = res['facets']['restaurant']['buckets']
                let newStore: {[key: number]:number} = {};
                rate.map((v, idx) => {
                    newStore[v['val']] = v['count']
                })
                console.log('stores, ', newStore);
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
        console.log(q);
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
                console.log(newNames);              
            }
        })

    },[facetRestaurant]);

    

    

    
    return (
        <>
            <Box
            sx={{width:"30vw", margin: "8px", height: "84vh", overflow: "scroll"}}>
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
                                    <ListItemButton sx={{width: "25vw", paddingLeft: "2px"}}>
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
                            <ListItemButton sx={{width: "25vw", paddingLeft: "2px"}}>
                                <ListItemText 
                                id={`${idx}`} 
                                primary={`${name[0]}(${facetRestaurant[name[1]]})`} />
                            </ListItemButton>
                        </ListItem>
                    }) 
                }
                </List>
                <Typography variant="body2">Filter By Year</Typography>
                <List dense sx={{ width: '100%', maxWidth: "25vw", bgcolor: 'background.paper' }}>
                {
                    facetDate!=undefined?
                    Object.keys(facetDate).map((ele: string, idx: number) => {
                        return (
                            <ListItem 
                            dense sx={{height:"4vh"}}
                            key={ele}
                            secondaryAction={
                                <Checkbox
                                    edge="end"
                                    onChange={handleDateSelect(ele)}
                                    checked={selectedDate.indexOf(ele) !== -1}
                                />
                            }>
                                <ListItemButton sx={{width: "25vw", paddingLeft: "2px"}}>
                                    <ListItemText 
                                    id={`${idx}`} 
                                    primary={`${ele.slice(0,4)}-${Number(ele.slice(0,4))+1} (${facetDate[ele]})`} />
                                </ListItemButton>
                            </ListItem>
                        )
                    }):<></>
                }</List>
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
                                <ListItemButton sx={{width: "25vw", paddingLeft: "2px"}}>
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
                top: "5vh", 
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
                                <Box sx={{ width: "62vw", margin: "5px"}}>
                                    <Typography variant="body1" display="inline">
                                        {review.user_name}
                                    </Typography>
                                    <Typography variant="caption" display="inline" marginLeft='5px'>
                                        {review.user_loc}
                                    </Typography>
                                </Box>
                                <Divider sx={{margin:"5px"}}/>
                                <Box sx={{ width: "95%", margin: "5px"}}>
                                    <Rating value={review.rating} readOnly size="small" />
                                    <Typography variant="caption" display="inline" style={{float: "right", margin: "inherit"}}>
                                        {date}
                                    </Typography>
                                </Box>
                                { highlight(review['review_txt']) }
                                
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