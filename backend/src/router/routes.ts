import { Express, Router } from 'express';
import userRouter from '../controller/user';
import authRouter from '../controller/auth';
import packageRouter from '../controller/package';
import customerRouter from '../controller/customer';

export default (app: Express) => {
    const apiRouter = Router();

    app.use('/api', apiRouter);
    apiRouter.use('/user', userRouter)
    apiRouter.use('/auth', authRouter)
    apiRouter.use('/package', packageRouter)
    apiRouter.use('/customer', customerRouter)
    
    apiRouter.use('*', (req, res) => {
        res.status(404).send('Not found!!!');
    });
};      
