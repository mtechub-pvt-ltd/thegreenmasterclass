import { Router } from 'express';
import { upload } from '../utils/ImageHandler.js';
import { createVideo, deleteAllVideos, deleteVideo, getAllVideos, getSpecificVideo, updateVideo } from '../controller/manageVideoController.js';

const manageVideoRoute = Router();

manageVideoRoute.post('/create',upload("videoThumbnailImages").single("thumbnail"), createVideo);
manageVideoRoute.delete('/deleteVideo/:id', deleteVideo);
manageVideoRoute.delete('/deleteAllVideos', deleteAllVideos);
manageVideoRoute.get('/getAllVideos', getAllVideos);
manageVideoRoute.get('/getSpecificVideo/:id', getSpecificVideo);
manageVideoRoute.put('/updateVideo',upload("videoThumbnailImages").single("thumbnail"), updateVideo);
export default manageVideoRoute;
