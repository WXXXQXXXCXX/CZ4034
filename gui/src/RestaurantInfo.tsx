import React, { FC, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';

const RestaurantInfo: FC<{}> = () =>{
    const [data, setData] = useState<any[]>([{
        'name': "Girl & The Goat",
        'rating': "4.5",
        'category': ['American (Traditional)','Diners', 'Bakery']
    }]);

    const info_list = useMemo(() => {
        return data.map((info) => (
            <Card sx={{ width: "27vw"}}>
                <CardContent>
                    <Typography variant="h5" component="div">
                        {info.name}
                    </Typography>
                    <Typography variant="body2">
                        Rating: {info.rating}
                    </Typography>
                    {
                        info.category.map((cat: string)=>(
                            <Chip sx={{marginTop: "4px", marginRight: "2px"}} size="small" color="info" label={cat}/>
                        ))
                    }
                </CardContent>
            </Card>
        ))
    }, [data])
    return (
        <>
            <Box sx={{margin: "5px"}}>
                {info_list}
            </Box>
            <MapContainer
            className="markercluster-map"
            style={{height: '92vh', width: "70vw", bottom: "0", right: "0", position:'absolute'}}
            center={[51.0, 19.0]}
            zoom={3}
            minZoom={2}
            maxZoom={18}
            >
                <TileLayer
                    noWrap={true}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />

                
            </MapContainer>
        </>
        
    )
}

export default RestaurantInfo;