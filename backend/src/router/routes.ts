import { Express, Router } from 'express';
import userRouter from '../controller/user';

export default (app: Express) => {
    const apiRouter = Router();

    app.use('/api', apiRouter);
    apiRouter.use('/user', userRouter)
    
    apiRouter.use('*', (req, res) => {
        res.status(404).send('Not found!!!');
    });
};      
