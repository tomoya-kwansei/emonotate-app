import React from "react";
import { 
    Box,
    Grid,
} from "@mui/material";
import { useState } from "react";
import YouTube from 'react-youtube';

import VideoController from './VideoController';

const YouTubeVideoComponent = props => {
    const [config, setConfig] = useState({
        autoplay: false,
        controls: true,
        disablekb: true,
        loop: false,
    });
    const { onReady, videoId } = props;
    return <Box>
        <Grid container>
            <Grid item xs="auto">
                <YouTube 
                    videoId={videoId}
                    onReady={onReady}
                    opts={{
                        width: 426,
                        height: 240,
                        playerVars: config
                    }} />
            </Grid>
            <Grid item xs>
                <VideoController config={config} 
                    onControllerChanged={config => setConfig(config) }/>
            </Grid>
        </Grid>
    </Box>;
};

export default YouTubeVideoComponent;
