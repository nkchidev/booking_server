import db from "../models/index";
require('dotenv').config();
import _, { reject } from 'lodash';
import EmailService from "./EmailSerivce"

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
let getTopDoctorHome = (limit) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limit,
                where: { roleId: 'R2'},
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    {model : db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                    {model : db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']}
                ],
                raw: true,
                nest: true
            })

            resolve({
                errCode: 0,
                data: users
            })

        } catch (error) {
            reject(error)
        }
    })
}

let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: {roleId: 'R2'}
            });

            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (error) {
            reject(error)
        }
    });
}

let saveDetailInfoDoctor = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(data);
            if(checkObj.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing parameter: ${checkObj.element}`
                });
            }else{
                // insert to markdown
                if (data.action === 'CREATE'){
                    await db.Markdown.create({
                        contentHTML: data.contentHTML,
                        contentMarkdown: data.contentMarkdown,
                        description: data.description,
                        doctorId: data.doctorId
                    })
                }else if (data.action === 'EDIT'){
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: { doctorId: data.doctorId},
                        raw: false
                    })
                    
                    if(doctorMarkdown){
                        doctorMarkdown.contentHTML= data.contentHTML;
                        doctorMarkdown.contentMarkdown= data.contentMarkdown;
                        doctorMarkdown.description= data.description;
                        await doctorMarkdown.save()
                    }
                }

                // insert to doctor_infor table
                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: data.doctorId,
                    },
                    raw: false
                });

                if(doctorInfo){
                    // Update 
                    doctorInfo.doctorId = data.doctorId;
                    doctorInfo.priceId = data.selectedPrice;
                    doctorInfo.provinceId = data.selectedProvince;
                    doctorInfo.paymentId = data.selectedPayment;
                    doctorInfo.nameClinic = data.nameClinic;
                    doctorInfo.addressClinic = data.addressClinic;
                    doctorInfo.note = data.note;
                    doctorInfo.specialtyId = data.specialtyId;
                    doctorInfo.clinicId = data.clinicId;
                    await doctorInfo.save(); 
                }else{
                    // Create 
                    await db.Doctor_Infor.create({
                        doctorId: data.doctorId,
                        priceId: data.selectedPrice,
                        provinceId: data.selectedProvince,
                        paymentId: data.selectedPayment,
                        nameClinic: data.nameClinic,
                        addressClinic: data.addressClinic,
                        note: data.note,
                        specialtyId: data.specialtyId,
                        clinicId: data.clinicId
                    });
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Save info doctor succeed!'
                })
            }
        }
        catch(e){
            reject(e);
        }
    });
}

let checkRequiredFields = (inputData) => {
    let arrFields = ['doctorId', 'contentHTML', 'contentMarkdown',
        'action', 'selectedPrice', 'selectedPayment', 
        'selectedProvince',
        'nameClinic','addressClinic', 'note', 'specialtyId'];
    let isValid = true;
    let element = '';
    for(let i = 0; i< arrFields.length; i++){
        if(!inputData[arrFields[i]]){
            isValid = false;
            element = arrFields[i];
            break;
        }
    }

    return {
        isValid: isValid,
        element: element
    }
}

let getDetailDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!id){
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                });
            }else{
                let data = await db.User.findOne({
                    where: {
                        id: id
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        }
                    ],
                    raw: false,
                    nest: true
                })

                if(data && data.image){
                    data.image = Buffer.from(data.image, 'base64').toString('binary');
                }

                if(!data) data = {};

                resolve({
                    errCode: 0,
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

let bulkCreateSchedule =  (data) =>{
    return new Promise (async(resolve, reject) =>{
        try{
            if(!data.arrSchedule || !data.doctorId || !data.formatedDate){
                resolve({
                    errCode: -1,
                    errMessage: 'Missing required param!'
                })
            }else{      
                let schedule = data.arrSchedule;
                if(schedule && schedule.length > 0){

                    schedule = schedule.map (item  => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }

                let existing = await db.Schedule.findAll(
                    { 
                        where: {doctorId: data.doctorId, date: data.formatedDate},
                        attributes:['timeType', 'date','doctorId','maxNumber'],
                        raw: true
                    }
                );

                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });

                if(toCreate && toCreate.length > 0){
                    await db.Schedule.bulkCreate(toCreate);
                }

                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                })
            }
        }catch(e){
            reject(e);
        }
    })
}

let getScheduleByDate = (doctorId, date) => {
    return new Promise(async(resolve, reject) => {
        try {
            if  (!doctorId || !date) {
                resolve({
                    error: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },

                    include: [                       
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.User, as: 'doctorData', attributes: ['firstname', 'lastname'] }
                    ],
                    raw: false,
                    nest: true
                })

                if (!dataSchedule) dataSchedule = [];

                resolve({
                    errCode: 0,
                    data: dataSchedule
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getExtraInforDoctorById = (idInput) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!idInput){
                resolve({
                    errCode: -1,
                    errMessage: 'Missing required parameters'
                })
            }else{
                let data = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: idInput
                    },
                    attributes: {
                        exclude: ['id', 'doctorId']
                    },
                    include: [
                        { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi']},
                        { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi']},
                        { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi']}
                    ],
                    raw: false,
                    nest: true
                });

                if(!data) data = {};

                resolve({
                    errCode: 0,
                    data: data
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

let getProfileDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {            
                let data = await db.User.findOne({
                    where: {
                        id: id
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {   model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },

                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']},
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [                            
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi']},
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi']},
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                    })

                    if (data && data.image) {
                        data.image = new Buffer(data.image, 'base64').toString('binary');
                    }

                    if (!data) data = {};

                    resolve({
                        errCode: 0,
                        data: data
                    })
            }
        } catch (e){
            reject(e);
        }
    })
}  

let getListPatientForDoctor = (doctorId, date) =>{
    return new Promise( async(resolve, reject) =>{
        try{
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {    
                let data = await db.Booking.findAll({
                    where:{
                        statusId: 'S2',
                        doctorId: doctorId,
                        date: date
                    },
                    include: [   
                        {
                            model: db.User, as: 'patientData',
                            attributes: ['email', 'firstName', 'address', 'gender'],
                            include: [                            
                                { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] 
                            }],
                        },  
                        {
                            model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi']
                        },                  
                    ],
                    raw: false,
                    nest: true
                })  

                resolve({
                    errCode: 0,
                    data: data
                })

            }

        }catch(e){
            reject(e);
        }
    })
}

let sendRemedy  = (data) =>{
    return new Promise( async(resolve, reject) =>{
        try{
            if (!data.email || !data.doctorId || !data.patientId || !data.timeType || !data.imageBase64) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {    
                // update patient status
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                });

                if(appointment){
                    appointment.statusId = 'S3';
                    await appointment.save();
                }
                await EmailService.sendAttachment(data);

                resolve({
                    errCode: 0,
                    errMessage: 'Save infor patient succeed!'
                });

            }

        }catch(e){
            reject(e);
        }
    })
}

module.exports = {
    getTopDoctorHome,
    getDetailDoctorById,
    saveDetailInfoDoctor,
    getAllDoctors,
    bulkCreateSchedule,
    getScheduleByDate,
    getExtraInforDoctorById,
    getProfileDoctorById,
    getListPatientForDoctor,
    sendRemedy
}