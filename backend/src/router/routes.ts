import express, { Express, Router } from 'express';
import userRouter from '../controller/user';
import authRouter from '../controller/auth';
import packageRouter from '../controller/package';
import customerRouter from '../controller/customer';
import serviceRouter from '../controller/service-connection';
import ticketRouter from '../controller/ticket';
import scheduleRouter from '../controller/schedule';
import tenantRouter from '../controller/tenant';
import dashboardRouter from '../controller/dashboard';
import networkRouter from '../controller/network';
import filesRouter from '../controller/files';
import { authLimiter } from '../middleware/rate-limit.middleware';

export default (app: Express) => {
    app.use(express.json({ limit: '10mb' }));

    const apiRouter = Router();

    app.use(express.urlencoded({ extended: true }));

    app.use('/api', apiRouter);

    // Auth routes dengan brute force protection (5 gagal = block 5 menit)
    apiRouter.use('/auth', authLimiter, authRouter);
    
    // Public file serving with signed URLs (no auth required, token verified in controller)
    apiRouter.use('/files', filesRouter);
    
    // Protected routes (dilindungi oleh global apiLimiter di app.ts)
    apiRouter.use('/user', userRouter);
    apiRouter.use('/package', packageRouter);
    apiRouter.use('/customer', customerRouter);
    apiRouter.use('/service-connection', serviceRouter);
    apiRouter.use('/ticket', ticketRouter);
    apiRouter.use('/schedule', scheduleRouter);
    apiRouter.use('/tenant', tenantRouter);
    
    // Dashboard (read-only)
    apiRouter.use('/dashboard', dashboardRouter);

    // Network topology (owner only)
    apiRouter.use('/network', networkRouter);

    apiRouter.use('*', (req, res) => {
        res.status(404).send('Not found!!!');
    });
};