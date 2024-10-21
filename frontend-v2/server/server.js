import express from "express"
import SpotifyWebApi from "spotify-web-api-node"
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/login', (req, res) => {
    const code = req.body.code

    const SpotifyApi = new SpotifyWebApi({
        redirectUri: "http://localhost:3000",
        clientId: "a1eae6a5e0884ad6818338c12e07d898",
        clientSecret: "8f52b5cf21294623aeea1771b0985cd5"
    })

    SpotifyApi.authorizationCodeGrant(code).then(data => {
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in
        })
    }).catch(() => {
        res.sendStatus(400)
    })
})


app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken;

    const SpotifyApi = new SpotifyWebApi({
        redirectUri: "http://localhost:3000",
        clientId: "a1eae6a5e0884ad6818338c12e07d898",
        clientSecret: "8f52b5cf21294623aeea1771b0985cd5",
        refreshToken
    })

    SpotifyApi.refreshAccessToken().then(data => {
            res.json({
                accessToken: data.body.accessToken,
                expiresIn: data.body.expiresIn
            })
        }
      ).catch(err => {
        res.sendStatus(400)
        console.log('Could not refresh access token', err);
      });
})

app.listen(3001)