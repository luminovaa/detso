import express, { Express, Router } from 'express';
import userRouter from '../controller/user';
import authRouter from '../controller/auth';
import packageRouter from '../controller/package';
import customerRouter from '../controller/customer';
import serviceRouter from '../controller/service-connection';
import whatsappRouter from '../controller/whatsapp';
import ticketRouter from '../controller/ticket';
import scheduleRouter from '../controller/schedule';

export default (app: Express) => {
    app.use(express.json({ limit: '10mb' }));

    const apiRouter = Router();

    app.use(express.urlencoded({ extended: true }));

    app.use('/api', apiRouter);

    apiRouter.use('/user', userRouter);
    apiRouter.use('/auth', authRouter);
    apiRouter.use('/package', packageRouter);
    apiRouter.use('/customer', customerRouter);
    apiRouter.use('/service-connection', serviceRouter);
    apiRouter.use('/whatsapp', whatsappRouter);
    apiRouter.use('/ticket', ticketRouter);
    apiRouter.use('/schedule', scheduleRouter)

    apiRouter.use('*', (req, res) => {
        res.status(404).send('Not found!!!');
    });
};