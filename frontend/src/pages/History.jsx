import { useContext, useEffect, useState } from 'react'
import AuthContext from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home'


const History = () => {

    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]); // list 



    const navigate = useNavigate();
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                console.log(history);
                setMeetings(history);
            } catch (error) {

            }
        }
        fetchHistory();
    }, [])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
    };

    return (
        <div>
            {/* use card from material UI */}
            <IconButton onClick={() => {
                navigate('/home');
            }}>
                <HomeIcon /> <span style={{ fontSize: "1rem", color: "#555", paddingLeft: "5px", paddingTop: "3px" }}>Home</span>
            </IconButton>
            {
                meetings.length > 0 && meetings.map((e, i) => {
                    return (
                        <Card key={i} variant="outlined">
                            <CardContent>
                                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                    Meeting Code: {e.meetingCode}
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    )
                })
            }
        </div>
    )
}

export default History
