# Chess.io  

**Chess.io** is an online chess game offering multiple modes and gameplay types to suit players of all skill levels. Developed with modern web technologies, it provides a smooth, responsive, and immersive chess experience, complete with AI-powered matches and multiplayer functionality.  

**Play Chess.io now**: [Chess.io on Render](https://chess-io-espy.onrender.com/)  

## Features  

### Game Modes  
1. **Same PC**: Play locally with a friend on the same device.  
2. **Player vs AI**: Challenge a computer opponent powered by the **Lichess Cloud Evaluation API**.  
3. **Multiplayer Online**: Connect with players worldwide in real time using WebSockets.  

### Game Types  
- **Blitz**: A fast-paced game with limited time for moves.  
- **Rapid**: Balanced timing for a medium-paced game.  
- **Classic**: Traditional chess with ample time for strategic moves.  

## Technology Stack  
- **Frontend**: HTML, CSS, React  
- **AI Integration**: Lichess Cloud Evaluation API  
- **Multiplayer Feature**: WebSockets  
- **Deployment**: [Render](https://render.com)  

## Getting Started  

### Prerequisites  
Ensure you have the following installed on your system:  
- Node.js (v14 or later)  
- npm or yarn  

### Installation  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/your-username/Chess.io.git  
   ```  
2. Navigate to the project directory:  
   ```bash  
   cd Chess.io  
   ```  
3. Install dependencies:  
   ```bash  
   npm install  
   ```  

### Running the Application  
1. Start the development server:  
   ```bash  
   npm start  
   ```  
2. Open your browser and navigate to `http://localhost:3000`.  

### Multiplayer Configuration  
The multiplayer feature uses WebSockets. Ensure your backend server is set up and running. Update the WebSocket server URL in the `src/config.js` file if required.  

### Player vs AI Configuration  
The **Player vs AI** mode leverages the Lichess Cloud Evaluation API. Ensure you have configured the API endpoint correctly in the project. The AI evaluates moves in real time, providing a challenging opponent.  

### Deployment  
The game is deployed using [Render](https://render.com). You can access the live version [here](https://chess-io-espy.onrender.com/).  

## Contributing  
Contributions are welcome! If you'd like to improve Chess.io, please follow these steps:  
1. Fork the repository.  
2. Create a new branch for your feature or bugfix.  
   ```bash  
   git checkout -b feature-name  
   ```  
3. Commit your changes.  
   ```bash  
   git commit -m "Description of changes"  
   ```  
4. Push to your branch.  
   ```bash  
   git push origin feature-name  
   ```  
5. Open a pull request.  

## License  
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.  

## Acknowledgments  
- **Lichess API**: For powering the Player vs AI mode.  
- Special thanks to the open-source community for tools and libraries used in this project.  
