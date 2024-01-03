/**
 * @author Mukund Khunt
 */
import server from './src';
const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log(`server started on port ${port}`);
});