import express, { Express, Router } from 'express';
import userRouter from '../controller/user';
import authRouter from '../controller/auth';
import packageRouter from '../controller/package';
import customerRouter from '../controller/customer';
import serviceRouter from '../controller/service-connection';
import whatsappRouter from '../controller/whatsapp';

export default (app: Express) => {
    const apiRouter = Router();

    app.use('/api', apiRouter);
    apiRouter.use('/user', userRouter)
    apiRouter.use('/auth', authRouter, express.json())
    apiRouter.use('/package', packageRouter, express.json())
    apiRouter.use('/customer', customerRouter)
    apiRouter.use('/service-connection', serviceRouter)
    apiRouter.use('/whatsapp', whatsappRouter, express.json())
    
    apiRouter.use('*', (req, res) => {
        res.status(404).send('Not found!!!');
    });
};      
