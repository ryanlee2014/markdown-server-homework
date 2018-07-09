var express = require('express');
var router = express.Router();
const query = require("../mysql_query");
/* GET home page. */
router.post("/data",(req,res)=>{
    const user_id = req.body.user_id;
    const password = req.body.password;
    const email = req.body.email;
    const data = req.body.data;
    console.log(req.body);
    query(`select * from user where UserId = ?`,[user_id])
        .then(async rows => {
            let check = false;
            if(rows && rows.length) {
                rows.forEach(el => {
                    if(el.UserPassword === password) {
                        check = true;
                    }
                })
            }
            else {
                await query(`insert into user (UserId,UserPassword,Mail)values(?,?,?)`,[user_id,password,email]);
                check = true;
            }
            if(check) {
                let convertedData = JSON.parse(data);
                let file = convertedData.file;
                let folder = convertedData.folder;
                await query(`delete from folder where UserId = ?`,[user_id]);
                await query(`delete from file where FolderId in (select FolderId from folder where UserId = ?)`,[user_id]);
                for(let i of folder) {
                    await query(`insert into folder 
                    (FolderId, UserId, FolderName, ColorLabel, LastFolderId) value (?,?,?,?,?)`,[i.FolderId,i.UserId,
                    i.FolderName,i.ColorLabel,i.LastFolderId]);
                }
                for(let i of file) {
                    await query(`insert into file (FileId, FolderId, Title, Password, Length, Markdown, CreateTime, UpdateTime)
    value (?,?,?,?,?,?,?,?)`,[i.FileId,i.FolderId,i.Title,i.Password,i.Length,i.Markdown,i.CreateTime,i.UpdateTime]);
                }
                res.json({
                    status:"OK"
                })
            }
        });
});

router.post("/get",async (req,res)=>{
    const user_id = req.body.user_id;
    const password = req.body.password;
    const _result = await query(`select * from user where UserId = ?`,[user_id]);
    let check = false;
    for(let i of _result) {
        if(i.UserPassword === password) {
            check = true;
        }
    }
    if(check) {
        const folders = await query(`select * from folder where UserId = ?`,[user_id]);
        const files = await query(`select * from file where FolderId in (select FolderId from folder where UserId = ?)`,[user_id]);
        res.json({
            status:"OK",
            data:{
                folder:folders,
                file:files
            }
        })
    }
    else {
        res.json({
            status:"ERROR",
            statement:"Not pass check"
        })
    }
});

module.exports = router;
