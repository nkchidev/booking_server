import { query } from "express";
import DoctorService from "../services/DoctorService";

let getTopDoctorHome = async (req, res) => {
    let limit = req.body.limit;
    if(!limit) limit = 10;
    try {
        let response = await DoctorService.getTopDoctorHome(+limit);
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            message: 'Error from server ....'
        })
    }
}

let getAllDoctors = async (req, res) => {
    try {
        let data = await DoctorService.getAllDoctors();
        return res.status(200).json(data);
    } catch (error) {
        return res.state(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let postInfoDoctor = async (req, res) => {
    try {
        let response = await DoctorService.saveDetailInfoDoctor(req.body);
        return res.status(200).json(response)
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let getDetailDoctorById = async (req, res) => {
    try {
        let info = await DoctorService.getDetailDoctorById(req.query.id);
        return res.status(200).json(info);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let bulkCreateSchedule = async (req, res) => {
    try{
        let info = await DoctorService.bulkCreateSchedule(req.body);
        return res.status(200).json(info);
    }catch (error){
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

let getScheduleByDate = async (req, res) => {
    try {
        let infor = await DoctorService.getScheduleByDate(req.query.doctorId, req.query.date);
        return res.status(200).json(
            infor
        )

    }catch(e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from sever'
        })
    }
}

let getExtraInforDoctorById = async (req, res) => {
    try {
        let infor = await DoctorService.getExtraInforDoctorById(req.query.doctorId);
        return res.status(200).json(infor);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from sever'
        })
    }
}

let getProfileDoctorById = async (req, res) => {
    try {
        let infor = await DoctorService.getProfileDoctorById(req.query.doctorId);
        return res.status(200).json(
            infor
        )
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the sever'
        })
    }
}

let getListPatientForDoctor =  async(req, res) =>{
    try {
        let infor = await DoctorService.getListPatientForDoctor(req.query.doctorId, req.query.date);
        return res.status(200).json(
            infor
        )
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the sever'
        })
    }
}

let sendRemedy = async (req, res) => {
    try {
        let infor = await DoctorService.sendRemedy(req.body);
        return res.status(200).json(
            infor
        )
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the sever'
        })
    }
}

module.exports = {
    getTopDoctorHome,
    getDetailDoctorById,
    postInfoDoctor,
    getAllDoctors,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy
}