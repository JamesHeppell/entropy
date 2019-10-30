var NUMBER_OF_COLS = 7,
	NUMBER_OF_ROWS = 7,
	BLOCK_SIZE = 100;

//TODO enable a n by n board n >= 3

var BLOCK_COLOUR_1 = '#9f7119',
	BLOCK_COLOUR_2 = '#debf83',
	HIGHLIGHT_COLOUR = '#fb0006',
    POSSIBLE_MOVE_COLOUR = 'blue';

var piecePositions = null;

var PIECE_RED = 0,
    PIECE_GREEN = 1,
    PIECE_PURPLE = 2,
    PIECE_ORANGE = 3,
    PIECE_BLACK = 4,
    PIECE_BLUE = 5,
    PIECE_YELLOW = 6,
	IN_PLAY = 0,
	IN_BAG = 1,
	pieces = null,
	ctx = null,
	json = null,
	canvas = null,
	ORDER_TEAM = 0,
	CHAOS_TEAM = 1,
	SELECT_LINE_WIDTH = 5,
	currentTurn = CHAOS_TEAM,
	selectedPiece = null;

var GAME_FINISHED = false;
var WINNING_PLAYER = "White";
var SCORE = 0;
var POSSIBLE_MOVES = [];

var GAME_RECORD = {"size":NUMBER_OF_COLS,
                   "moveList":[]};
var canvasNextPiece = null,
    ctxNextPiece =null;

function screenToBlock(x, y) {
	var block =  {
		"row": Math.floor(y / BLOCK_SIZE),
		"col": Math.floor(x / BLOCK_SIZE)
	};

	return block;
}


function getPieceAtBlock(clickedBlock) {

	var curPiece = null,
		iPieceCounter = 0,
		pieceAtBlock = null;
    
    
	for (iPieceCounter = 0; iPieceCounter < json.pieces.length; iPieceCounter++) {

		curPiece = json.pieces[iPieceCounter];

		if (curPiece.status === IN_PLAY &&
				curPiece.col === clickedBlock.col &&
				curPiece.row === clickedBlock.row) {
			curPiece.position = iPieceCounter;

			pieceAtBlock = curPiece;
			iPieceCounter = json.pieces.length;
		}
	}

	return pieceAtBlock;
}


function isPieceAtBlock(curPiece, row, col){
    return (curPiece.row == row && curPiece.col == col);
}

function blockOccupied(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock);

	return (pieceAtBlock !== null);
}

function canPawnMoveToBlock(selectedPiece, clickedBlock) {
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        if(clickedBlock.col == POSSIBLE_MOVES[i].col &&
           clickedBlock.row == POSSIBLE_MOVES[i].row){
            return true;
        }
    }
	return false;
}

function setPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    POSSIBLE_MOVES = [];
    
    //check move by slected piece
    checkMove(pieceAtBlock)

}


function checkMove(pieceAtBlock){
    //Piece moves like a rook in chess
    var currentRow = pieceAtBlock.row;
    var currentCol = pieceAtBlock.col;
    var foundBlockingPiece;
    var rowToConsider;
    var colToConsider;
    var blockToConsider;
    var row;
    var col;
    
    //down the board (row increases)
    foundBlockingPiece = false;
    for (row=1; row<NUMBER_OF_ROWS; row++){
        rowToConsider = currentRow + row;
        colToConsider = currentCol;
        blockToConsider = {"row":rowToConsider, "col":colToConsider};
        if(!foundBlockingPiece && rowToConsider < NUMBER_OF_ROWS){
            if(blockOccupied(blockToConsider)){
                foundBlockingPiece = true;
            }else{
                POSSIBLE_MOVES.push(blockToConsider);
            }
        }
    }
    
    //up the board (row decreases)
    foundBlockingPiece = false;
    for (row=1; row<NUMBER_OF_ROWS; row++){
        rowToConsider = currentRow - row;
        colToConsider = currentCol;
        blockToConsider = {"row":rowToConsider, "col":colToConsider};
        if(!foundBlockingPiece && rowToConsider >= 0){
            if(blockOccupied(blockToConsider)){
                foundBlockingPiece = true;
            }else{
                POSSIBLE_MOVES.push(blockToConsider);
            }
        }
    }
    
    //across (left) the board (col decreases)
    foundBlockingPiece = false;
    for (col=1; col<NUMBER_OF_COLS; col++){
        rowToConsider = currentRow;
        colToConsider = currentCol - col;
        blockToConsider = {"row":rowToConsider, "col":colToConsider};
        if(!foundBlockingPiece && colToConsider >= 0){
            if(blockOccupied(blockToConsider)){
                foundBlockingPiece = true;
            }else{
                POSSIBLE_MOVES.push(blockToConsider);
            }
        }
    }
    
    //across (right) the board (col increases)
    foundBlockingPiece = false;
    for (col=1; col<NUMBER_OF_COLS; col++){
        rowToConsider = currentRow;
        colToConsider = currentCol + col;
        blockToConsider = {"row":rowToConsider, "col":colToConsider};
        if(!foundBlockingPiece && colToConsider < NUMBER_OF_COLS){
            if(blockOccupied(blockToConsider)){
                foundBlockingPiece = true;
            }else{
                POSSIBLE_MOVES.push(blockToConsider);
            }
        }
    }
    
    console.log(POSSIBLE_MOVES.length + " possible moves!");
    
    //add moving to current pos as no move!
    POSSIBLE_MOVES.push({"row":currentRow, "col":currentCol});
}



function highlightPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    setPossibleMoves(pieceAtBlock);
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawOutline(POSSIBLE_MOVE_COLOUR, ctx, POSSIBLE_MOVES[i]);
    }
}

function unHighlightPossibleMoves(){
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawBlock(POSSIBLE_MOVES[i].col, POSSIBLE_MOVES[i].row);
    }
}

function canSelectedMoveToBlock(selectedPiece, clickedBlock) {
	var bCanMove = false;

    bCanMove = canPawnMoveToBlock(selectedPiece, clickedBlock);

	return bCanMove;
}


function calculateScore(){
    var currentScore = 0;
    var row;
    var col;
    var curPieces= [];
    var curPiece;
    var piece1;
    var piece2;
    
    //rows
    for (row=0; row<NUMBER_OF_ROWS; row++){
        //checkTwoBlocks
        for (col=1; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 1});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                currentScore += 2;
            }
        }
        
        //checkThreeBlocks
        for (col=2; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 2});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                currentScore += 3;
            }
        }
        
        //checkFourBlocks
        for (col=3; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 3});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row, "col":col - 1});
                piece2 = getPieceAtBlock({"row":row, "col":col - 2});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    currentScore += 4;
                }
            }
        }
        
        //checkFiveBlocks
        for (col=4; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 4});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row, "col":col - 1});
                piece2 = getPieceAtBlock({"row":row, "col":col - 3});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    currentScore += 5;
                }
            }
        }
        
        //checkSixBlocks
        for (col=5; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 5});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row, "col":col - 1});
                piece2 = getPieceAtBlock({"row":row, "col":col - 4});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    //check inside two peices
                    piece1 = getPieceAtBlock({"row":row, "col":col - 2});
                    piece2 = getPieceAtBlock({"row":row, "col":col - 3});
                    if (piece1 != null && piece2 != null &&
                    piece1.piece == piece2.piece){
                        currentScore += 6;
                    }
                }
            }
        }
        
        //checkSevenBlocks
        for (col=6; col<NUMBER_OF_COLS; col++){
            piece1 = getPieceAtBlock({"row":row, "col":col - 6});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row, "col":col - 1});
                piece2 = getPieceAtBlock({"row":row, "col":col - 5});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    //check inside two peices
                    piece1 = getPieceAtBlock({"row":row, "col":col - 2});
                    piece2 = getPieceAtBlock({"row":row, "col":col - 4});
                    if (piece1 != null && piece2 != null &&
                    piece1.piece == piece2.piece){
                        currentScore += 7;
                    }
                }
            }
        }
    }
    
    //columns
    for (col=0; col<NUMBER_OF_COLS; col++){
        //checkTwoBlocks
        for (row=1; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row -1, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                currentScore += 2;
            }
        }
        
        //checkThreeBlocks
        for (row=2; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row -2, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                currentScore += 3;
            }
        }
        
        //checkFourBlocks
        for (row=3; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row -3, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row - 1, "col":col});
                piece2 = getPieceAtBlock({"row":row - 2, "col":col});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    currentScore += 4;
                }
            }
        }
        
        //checkFiveBlocks
        for (row=4; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row - 4, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row - 1, "col":col});
                piece2 = getPieceAtBlock({"row":row - 3, "col":col});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    currentScore += 5;
                }
            }
        }
        
        //checkSixBlocks
        for (row=5; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row - 5, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row - 1, "col":col});
                piece2 = getPieceAtBlock({"row":row - 4, "col":col});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    //check inside two peices
                    piece1 = getPieceAtBlock({"row":row - 2, "col":col});
                    piece2 = getPieceAtBlock({"row":row - 3, "col":col});
                    if (piece1 != null && piece2 != null &&
                    piece1.piece == piece2.piece){
                        currentScore += 6;
                    }
                }
            }
        }
        
        //checkSevenBlocks
        for (row=6; row<NUMBER_OF_ROWS; row++){
            piece1 = getPieceAtBlock({"row":row - 6, "col":col});
            piece2 = getPieceAtBlock({"row":row, "col":col});
            if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                //check inside two peices
                piece1 = getPieceAtBlock({"row":row - 1, "col":col});
                piece2 = getPieceAtBlock({"row":row - 5, "col":col});
                if (piece1 != null && piece2 != null &&
                piece1.piece == piece2.piece){
                    //check inside two peices
                    piece1 = getPieceAtBlock({"row":row - 2, "col":col});
                    piece2 = getPieceAtBlock({"row":row - 4, "col":col});
                    if (piece1 != null && piece2 != null &&
                    piece1.piece == piece2.piece){
                        currentScore += 7;
                    }
                }
            }
        }
    }
    
    
    SCORE = currentScore;
}

function getBlockColour(iRowCounter, iBlockCounter) {
	var cStartColour;

	// Alternate the block colour
	if (iRowCounter % 2) {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_1 : BLOCK_COLOUR_2);
	} else {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_2 : BLOCK_COLOUR_1);
	}

	return cStartColour;
}

function drawBlock(iRowCounter, iBlockCounter) {
	// Set the background
	ctx.fillStyle = getBlockColour(iRowCounter, iBlockCounter);

	// Draw rectangle for the background
	ctx.fillRect(iRowCounter * BLOCK_SIZE, iBlockCounter * BLOCK_SIZE,
		BLOCK_SIZE, BLOCK_SIZE);

	ctx.stroke();
}

function getImageCoords(pieceCode, imageBlockSize) {
	var imageCoords =  {
		"x": 0,
		"y": pieceCode * imageBlockSize
	};

	return imageCoords;
}

function drawPiece(curPiece) {
    if (curPiece.status == IN_BAG){
        console.log("trying to draw in bag piece...");
        return;
    }
    var imageBlockSize = 100;
	var imageCoords = getImageCoords(curPiece.piece, imageBlockSize);

	// Draw the piece onto the canvas
	ctx.drawImage(pieces,
		imageCoords.x, imageCoords.y,
		imageBlockSize, imageBlockSize,
		curPiece.col * BLOCK_SIZE + BLOCK_SIZE * 0.1, curPiece.row * BLOCK_SIZE + BLOCK_SIZE * 0.1,
		BLOCK_SIZE*0.8, BLOCK_SIZE*0.8);
}

function removeSelection(selectedPiece) {
    unHighlightPossibleMoves();
	drawBlock(selectedPiece.col, selectedPiece.row);
	drawPiece(selectedPiece);
}

function drawPieces() {
	var iPieceCounter;

	// Loop through each piece and draw it on the canvas	
	for (iPieceCounter = 0; iPieceCounter < json.pieces.length; iPieceCounter++) {
		drawPiece(json.pieces[iPieceCounter]);
	}
}


function drawRow(iRowCounter) {
	var iBlockCounter;

	// Draw 8 block left to right
	for (iBlockCounter = 0; iBlockCounter < NUMBER_OF_ROWS; iBlockCounter++) {
		drawBlock(iRowCounter, iBlockCounter);
	}
}

function drawBoard() {
	var iRowCounter;

	for (iRowCounter = 0; iRowCounter < NUMBER_OF_ROWS; iRowCounter++) {
		drawRow(iRowCounter);
	}

	// Draw outline
	ctx.lineWidth = 3;
	ctx.strokeRect(0, 0,
		NUMBER_OF_ROWS * BLOCK_SIZE,
		NUMBER_OF_COLS * BLOCK_SIZE);
}

function defaultPositions() {
    json = {"pieces":[]};
    
    for (var i=0; i<NUMBER_OF_COLS; i++){
        for (var j=0; j<NUMBER_OF_COLS; j++){
            json.pieces.push({
                "piece": i,
                "row": -1,
                "col": -1,
                "status": IN_BAG
            })
        }
    }
	
}

function drawOutline(colourToHighlight, ctx, pieceAtBlock){
    ctx.lineWidth = SELECT_LINE_WIDTH;
	ctx.strokeStyle = colourToHighlight;
	ctx.strokeRect((pieceAtBlock.col * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		(pieceAtBlock.row * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2),
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2));
}

function selectPiece(pieceAtBlock) {
	// Draw outline
	drawOutline(HIGHLIGHT_COLOUR, ctx, pieceAtBlock)
    
	selectedPiece = pieceAtBlock;
    highlightPossibleMoves(pieceAtBlock);
}

function checkIfPieceClicked(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock);
    
    //consol logs
    console.log("Selected block (col,row) (" + clickedBlock.col + ", " + clickedBlock.row + ")");
    
	if (pieceAtBlock !== null){
        selectPiece(pieceAtBlock);
    }     	
}

function movePiece(clickedBlock) {
	// Clear the block in the original position
	drawBlock(selectedPiece.col, selectedPiece.row);
    unHighlightPossibleMoves();
    
    //record the game after a move has been played (undo button??)
    GAME_RECORD.moveList.push({"from":{"row":selectedPiece.row, "col":selectedPiece.col} ,                                  "to":{"row":clickedBlock.row, "col":clickedBlock.col}
                              });
    console.log("Number of moves in record: " + GAME_RECORD.moveList.length);
    
    var moveText = "(" + selectedPiece.row + ", " + selectedPiece.col + ")" +
                   "  ->  (" + clickedBlock.row + ", " + clickedBlock.col + ")";
    
    writeToScoreCard(moveText);

	json.pieces[selectedPiece.position].col = clickedBlock.col;
	json.pieces[selectedPiece.position].row = clickedBlock.row;


	// Draw the piece in the new position
	drawPiece(selectedPiece);
    
    selectedPiece = null;
    calculateScore();
    // check win condition before changing turn
    check_win_condition(clickedBlock);
    
	currentTurn = (currentTurn === CHAOS_TEAM ? ORDER_TEAM : CHAOS_TEAM);
    
    //get new peice for choas turn
    if (getNumberOfPiecesInBag() > 0){
        getRandomPieceInBag();
    }
    
    console.log("==============================");
}

function getRandomPieceInBag(){
    var rePick = true;
    while (rePick){    
        var randidx = Math.floor(Math.random() * json.pieces.length);
        if (json.pieces[randidx].status == IN_BAG){
            selectedPiece = json.pieces[randidx];
            selectedPiece.status = IN_PLAY;
            selectedPiece.position = randidx;
            rePick = false;
        }
    }
    
    //draw piece on NextPiece canvas
    var imageBlockSize = 100;
	var imageCoords = getImageCoords(selectedPiece.piece, imageBlockSize);
    
    console.log("trying to draw peice on display canvas");
    // Draw the piece onto the canvas
	ctxNextPiece.drawImage(pieces,
		imageCoords.x, imageCoords.y,
		imageBlockSize, imageBlockSize,
		0, 0,
		BLOCK_SIZE*0.8, BLOCK_SIZE*0.8);
    
}

function getNumberOfPiecesInBag(){
    var piecesInBag = 0;
    for (var i=0; i<json.pieces.length; i++){
        if (json.pieces[i].status==IN_BAG){
            piecesInBag++;
        }
    }
    return piecesInBag;
}

function processChoasMove(clickedBlock){
    console.log("Processing Chaos move");
    // Draw the piece in the new position
    
    json.pieces[selectedPiece.position].col = clickedBlock.col;
    json.pieces[selectedPiece.position].row = clickedBlock.row;
    
	drawPiece(selectedPiece);
    
    
    var moveText = selectedPiece.piece + " -> (" +
                   clickedBlock.row + ", " + clickedBlock.col + ")";
    
    writeToScoreCard(moveText);
    calculateScore();
    selectedPiece = null;
    currentTurn = (currentTurn === CHAOS_TEAM ? ORDER_TEAM : CHAOS_TEAM); 
    
    //remove piece from nextpeice canvas
    colorRect(0,0,canvasNextPiece.width,canvasNextPiece.height,'White', ctxNextPiece);
}

function processOrderMove(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock)
    
    if (pieceAtBlock == selectedPiece){
        movePiece(clickedBlock);
    }else{
    
        if (pieceAtBlock !== null) {
            removeSelection(selectedPiece);
            checkIfPieceClicked(clickedBlock);
        } else if (canSelectedMoveToBlock(selectedPiece, clickedBlock)) {
            movePiece(clickedBlock);
        }
    }
}

function colorRect(leftX,topY, width,height, drawColor, ctx) {
	ctx.fillStyle = drawColor;
	ctx.fillRect(leftX,topY, width,height);
}



function check_win_condition(clickedBlock){
    console.log("current turn is " + currentTurn);
    console.log("moved to row " + clickedBlock.row);
    console.log("moved to col " + clickedBlock.col);
    
    if (getNumberOfPiecesInBag()==0){
        WINNING_PLAYER = "GAME OVER";
        GAME_FINISHED = true;
        draw();
    }

}      


function resetScoreCard(){
    var list = document.getElementById('moveList');
    while(list.firstChild){
        list.removeChild(list.firstChild)
    }
}

function writeToScoreCard(moveText){
    var list = document.getElementById('moveList');
    var node = document.createElement("LI");
    var textnode = document.createTextNode(moveText);
    node.appendChild(textnode);
    list.appendChild(node);
}

function writeScore(score){
    var element = document.getElementById('score');
    element.innerHTML = score;
}

function board_click(ev) {
    var canvasClientRect = canvas.getBoundingClientRect();
	
    var x = ev.clientX - canvasClientRect.left,
		y = ev.clientY - canvasClientRect.top,
		clickedBlock = screenToBlock(x, y);
    
    console.log("Clicked block (col,row) (" + clickedBlock.col + ", " + clickedBlock.row + ")");
    
    if (GAME_FINISHED){
        GAME_FINISHED = false;
        draw();
        return; 
    }
    
    if(currentTurn === CHAOS_TEAM){
        //CHAOS TURN
        console.log("CHOAS TURN");
        if(!blockOccupied(clickedBlock)){
            processChoasMove(clickedBlock);
        }
        
    }else{
        //ORDER TURN
        console.log("ORDER TURN");
        if (selectedPiece === null) {
            checkIfPieceClicked(clickedBlock);
        } else {
            processOrderMove(clickedBlock);
        }
    }
    
    writeScore(String(SCORE));

}

function drawWinScreen(canvas, ctx){
    colorRect(0,0,canvas.width,canvas.height,'black', ctx);
    ctx.font="30px Arial";
    ctx.fillStyle = 'white';
    ctx.textBasline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(WINNING_PLAYER + " wins!", canvas.width/2, canvas.height/4);
}

function nextPieceCanvasSetup(){
    canvasNextPiece = document.getElementById('nextPiece');
    ctxNextPiece = canvasNextPiece.getContext('2d');
}


function draw() {
	// Main entry point got the HTML5 chess board example
    
    //set constants for reseting game
    currentTurn = CHAOS_TEAM;
    resetScoreCard();
    SCORE = 0;
    writeScore(SCORE);
    nextPieceCanvasSetup();
    
	canvas = document.getElementById('board');

	// Canvas supported?
	if (canvas.getContext) {
		ctx = canvas.getContext('2d');

		// Calculdate the precise block size
		BLOCK_SIZE = canvas.height / NUMBER_OF_ROWS;
        
        if (GAME_FINISHED){
            drawWinScreen(canvas, ctx);
            return;
        }
        
		// Draw the background
		drawBoard();

		defaultPositions();

		// Draw pieces
		pieces = new Image();
		pieces.src = 'pieces.png';
        addPiecesLoadEvent(drawPieces);
        addPiecesLoadEvent(getRandomPieceInBag);
		
        
		canvas.addEventListener('click', board_click, false);
	} else {
		alert("Canvas not supported!");
	}
}

function addPiecesLoadEvent(func) {
  var oldonload = pieces.onload;
  if (typeof pieces.onload != 'function') {
    pieces.onload = func;
  } else {
    pieces.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}