import { Box } from '@mui/system';
import React, { FC, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TextField, Typography } from '@mui/material';


const RestaurantReview: FC<{}> = ({}) => {
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
                <Typography variant="body2">Filter By Restaurant</Typography>
            </Box>

            <Box
            sx={{width:"69vw"}}>

            </Box>

    
        </>
    )
}

export default RestaurantReview;