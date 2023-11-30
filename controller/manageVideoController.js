
import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
// import { getAllRows, getSingleRow } from "../queries/Common.js";
import { handle_delete_photo_from_folder } from "../utils/handleDeletePhoto.js";
export const createVideo = async (req, res) => {
  try {
    const { title,video_link } = req.body;
    if (req.file) {
      let thumbnail = `/videoThumbnailImages/${req.file.filename}`;
      const createQuery =
        "INSERT INTO videos (title,thumbnail,video_link) VALUES($1,$2,$3) RETURNING *";
      const result = await pool.query(createQuery, [
        title,thumbnail,video_link
      ]);
      if (result.rowCount === 1) {
        return res
          .status(201)
          .json({ statusCode: 201, message: "Video created successfully",data:result.rows[0]  });
      }
      res.status(400).json({ statusCode: 400, message: "Not created" });
    } else {
      res.status(400).json({ statusCode: 400, message: "image not uploaded" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  try {
    const condition={
        column:"id",
        value:id
    }
     const oldImage=await getSingleRow("videos",condition)
     if(!oldImage[0]){
     return res.status(404).json({statusCode:404,message:"Video not found "})
     }
    const oldImageSplit = oldImage[0].thumbnail.replace(
      "/videoThumbnailImages/",
      ""
    );
    const delQuery = "DELETE FROM videos WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video thumbnail not deleted" });
    }
    handle_delete_photo_from_folder(oldImageSplit, "videoThumbnailImages");
    res
      .status(200)
      .json({ statusCode: 200, message: "Video deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteAllVideos = async (req, res) => {
  try {
    // Get all video records
    const query=`SELECT * FROM videos`
    const all = await pool.query(query);
   const allVideos=all.rows
    // Delete each video record and its associated image
    for (const video of allVideos) {
      const { id, thumbnail } = video;

      // Delete video record
      const deleteQuery = "DELETE FROM videos WHERE id=$1";
      await pool.query(deleteQuery, [id]);

      // Delete associated image
      const imageFilename = thumbnail.replace("/videoThumbnailImages/", "");
      handle_delete_photo_from_folder(imageFilename, "videoThumbnailImages");
    }

    res.status(200).json({ statusCode: 200, message: "All videos deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    // const page = req.query.page || 1; // Get the page number from the query parameters
    // const perPage = 10; // Set the number of results per page
    // // Calculate the offset based on the page number and perPage
    // const offset = (page - 1) * perPage;
    const videoQuery=`SELECT * FROM videos ORDER BY videos.id`
    const {rows} = await pool.query(videoQuery);
    res.status(200).json({statusCode:200,totalVideos:rows.length,AllVideos:rows});

    // const result = await getAllRows("meal");
    // if (result.length > 0) {
    //   return res
    //     .status(200)
    //     .json({ statusCode: 200, Meals: result });
    // } else {
    //   res.status(404).json({ statusCode: 404, message: "No meal found" });
    // }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error:error.stack });
  }
};

export const getSpecificVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const condition={
        column:"id",
        value:id
    }
    const result=await getSingleRow("videos",condition)
    if (result[0]) {
      return res
        .status(200)
        .json({ statusCode: 200, Video: result[0] });
    } else {
      res.status(404).json({ statusCode: 404, message: "No video found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateVideo = async (req, res) => {
    try {
      const {id, title, video_link } = req.body;
      const condition={
          column:"id",
          value:id
      }
      const oldImage=await getSingleRow("videos",condition)
      if(!oldImage[0]){
          return res.status(404).json({statusCode:404,message:"Video not found "})
      }
      let updateData = {
        title,
        video_link,
        thumbnail: null,
      };
      if (req.file && req.file.filename) {
        updateData.thumbnail = `/videoThumbnailImages/${req.file.filename}`;
        const imageSplit = oldImage[0].thumbnail.replace(
          "/videoThumbnailImages/",
          ""
        );
        handle_delete_photo_from_folder(imageSplit, "videoThumbnailImages");
      } else {
        updateData.thumbnail = oldImage[0].thumbnail;
      }
  
      const updateType =
        `UPDATE videos SET title=$1,thumbnail=$2,video_link=$3,updated_at=NOW() WHERE id=$4 RETURNING *`;
      const result = await pool.query(updateType, [
        updateData.title,
        updateData.thumbnail,
        updateData.video_link,
        id,
      ]);
      if (result.rowCount === 1) {
        return res
          .status(200)
          .json({ statusCode: 200, updateType: result.rows[0] });
      } else {
        res
          .status(404)
          .json({ statusCode: 404, message: "Operation not successfull" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
