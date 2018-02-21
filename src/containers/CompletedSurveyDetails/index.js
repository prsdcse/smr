import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import _ from 'lodash';
import {
    colors, FormRow, List, Button, ListItem,
    WalletHeader, RadioButton, Divider, FormInput, Card
} from '../../components/PocketUI/index';
import realm from '../../providers/realm';
import moment from 'moment';
import * as axios from 'axios';
export default class CompletedSurveyDetails extends React.Component {
    static navigationOptions = ({ navigation }) => {
        const { params = {} } = navigation.state;
        return {
            title: 'Completed Survey',
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold' },
            headerStyle: { height: 60, borderWidth: 1, borderBottomColor: 'white', padding: 10 },
            headerRight: (
                <Button
                    buttonStyle={{ width: 170, height: 100, backgroundColor: '#4c9689' }}
                    title='Submit'
                    onPress={params.handleSubmit}
                />
            ),
        };
    }
    state = {
        selectedTab: 'CompletedSurveyDetails'
    };
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            surveyDetails: []
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({ handleSubmit: this.handleSubmit.bind(this) });
    }
    componentWillMount() {
        const surveyDatafromRealm = JSON.parse(JSON.stringify(realm.objects('SurveyInformation').filtered('status="saved"')));
        const grouped = _.groupBy(surveyDatafromRealm, 'HouseholdID');
        this.setState({ loading: false, surveyDetails: _.values(grouped) });
    }

    handleSubmit() {
        const { dispatch } = this.props.navigation;
        /* NetInfo.isConnected.fetch().then(isConnected => {
            alert('isConnected', isConnected);
        }); */
        Alert.alert(
            'Submit Survey Information',
            'Do you want to submit Survey Details for the cluster ',
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                {
                    text: 'OK',
                    onPress: () => {
                        this.setState({
                            loading: true
                        });
                        const postData = {
                            surveyDetails: this.state.surveyDetails
                        };
                        console.log('postData', postData);
                        axios.post('http://www.allianceaircon.com/MRSurvey/Survey_information.php', postData)
                            .then((response) => {
                                console.log(response);

                                //let idList = [];
                                realm.write(() => {
                                    _.forEach(realm.objects('SurveyInformation').filtered('status="saved"'), (survey) => {
                                        console.log(survey.surveyID);
                                        realm.create('SurveyInformation', { surveyID: survey.surveyID, status: 'completed' }, true);
                                        console.log(JSON.parse(JSON.stringify(realm.objects('SurveyInformation'))));
                                    });
                                    this.setState({
                                        loading: false
                                    });
                                    dispatch({ type: 'goToDashboard' });
                                });
                            })
                            .catch((error) => {
                                console.log(JSON.stringify(error));
                                if (JSON.stringify(error).status == '503' || JSON.stringify(error).status == '503') {
                                    if (realm.objects('ServerUnavailable').length == 0) {
                                        realm.write(() => {
                                            realm.create('ServerUnavailable', { updatedTimeStamp: new Date() });
                                        });
                                    } else {
                                        const lastUpdatedTime = JSON.parse(JSON.stringify(realm.objects('ServerUnavailable')))[0].updatedTimeStamp;
                                        const timeDifference = Math.floor((new Date().getTime() - lastUpdatedTime) / (1000 * 60));
                                        if (timeDifference > 15) {

                                        }
                                    }
                                }
                                this.setState({
                                    loading: false
                                });
                                dispatch({ type: 'goToDashboard' });
                            });
                        console.log('submit clutser information', postData);
                    }
                },
            ],
            { cancelable: false }
        );
    }
    render() {
        const { navigate } = this.props.navigation;

        return (
            <ScrollView style={{ backgroundColor: 'white', paddingTop: 20, paddingBottom: 20 }}>
                {this.state.surveyDetails.map((survey, index) => (<Card
                    key={index}
                    onPress={() => navigate('ViewSurveyDetails', { individualInfo: survey[0].IndividualInfo, HouseholdID: survey[0].HouseholdID })}
                    title={`Head Name : ${survey[0].HoueholdHead}`}
                    subTitle={`Household ID : ${survey[0].HouseholdID}`}
                    number={`Count : ${survey[0].selectedIndividualCount}`}
                    expiration={`Last Updated : ${moment().format('DD-MM-YYYY h:mm:ss a')}`}
                    moreText='View'
                />), this)}
            </ScrollView>
        );
    }
}
