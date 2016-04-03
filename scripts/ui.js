var UI = function(){
    var _canvas = null;
    var _ctx = null;

    var _gap = null;
    var _clickable = false;

    var _chessColor = ["#000","green"];
    var _chessSwitch = [1,0];
    var _current = 0;
    var _gameEnded = false;

    var _usedCoords = []; //保存已经下过棋子的坐标

    var _defaultOptions = {
        borderLength : 600,
        borderSize : 15,
        onClick : null
    };

    /**
     * 初始化棋盘
     */
    function boardInit(){
        _gap = Math.floor(_defaultOptions.borderLength/(_defaultOptions.borderSize+1));

        var bounds = [];
        for( var i = 0; i < _defaultOptions.borderSize+2; i++ ){
            bounds.push(_gap*i);
        }

        _ctx.beginPath();
        for( var i = 1; i < bounds.length-1; i++ ){
            _ctx.moveTo(bounds[i], bounds[1]);
            _ctx.lineTo(bounds[i], bounds[bounds.length-2]);
            _ctx.moveTo(bounds[1], bounds[i]);
            _ctx.lineTo(bounds[bounds.length-2], bounds[i]);
        }
        _ctx.stroke();
        _ctx.closePath();


        _canvas.onclick = function(){
            if( _gameEnded || (!_clickable) ){
                return;
            }
            var chess = getChessPositionByCoord( event.offsetX, event.offsetY );
            if( null != chess ){
                for( var i = 0; i < _usedCoords.length; i++ ){
                    if( chess.x==_usedCoords[i].x && chess.y==_usedCoords[i].y ){
                        return;
                    }
                }

                putChess( chess.x, chess.y );
                _usedCoords.push(chess);
                _current = _chessSwitch[_current];
            }
            // 暴露给外部的点击处理接口
            if( typeof _defaultOptions.onClick == 'function'){
                _defaultOptions.onClick( chess.x, chess.y, _current );
            }
        }
        _canvas.onmousemove = function(){
            if( _gameEnded ){
                return;
            }
            if( null != closeToWhichCrossPoint(event.offsetX, event.offsetY) ){
                _canvas.style.cursor = "pointer";
                _clickable = true;
            }else{
                _canvas.style.cursor = "auto";
                _clickable = false;
            }
        }
    }

    function putChess( x, y ){
        var point = getCoordByCheesIndex(x, y);
        _ctx.save();
        _ctx.beginPath();
        _ctx.arc(point.x,point.y,_gap*0.3,0,2*Math.PI);
        _ctx.fillStyle = _chessColor[_current];
        _ctx.fill();
        _ctx.closePath();
        _ctx.restore();
    }

    /**
     * 根据坐标值获取棋子的位置
     * @param x begin with 1
     * @param y begin with 1
     */
    function getChessPositionByCoord( x, y ){

        var possibleXIdx = Math.floor(x/_gap);
        var possibleYIdx = Math.floor(y/_gap);
        var offsetObj = closeToWhichCrossPoint(x,y);
        if( null != offsetObj ){
            return {x:(possibleXIdx+offsetObj.ox),y:(possibleYIdx+offsetObj.oy)};
        }
        return null;
    }

    /**
     * 判断和哪个交叉点更靠近
     * 返回x和y的offset
     * 都不靠近返回null
     */
    function closeToWhichCrossPoint( x, y ){
        var offsetX = x%_gap;
        var offsetY = y%_gap;
        for( var i = 0; i <=1; i++ ){
            for( var j = 0 ; j <=1; j++ ){
                var tx = i*_gap-offsetX;
                var ty = j*_gap-offsetY;
                if( tx*tx+ty*ty <= _gap*_gap*0.09 ){
                    return { ox:i,oy:j };
                }
            }
        }
        return null;
    }

    /**
     * 获取棋盘上某一交叉点的坐标
     * @param x begin with 1
     * @param y begin with 1
     */
    function getCoordByCheesIndex( x, y ){
        return {x:x*_gap,y:y*_gap};
    }

    function endGame(){
        _gameEnded = true;
        _canvas.style.cursor = "auto";
    }

    function init(opts){
        _defaultOptions.extend(opts);

        _canvas = document.getElementById("board");
        _canvas.width = _defaultOptions.borderLength;
        _canvas.height = _defaultOptions.borderLength;
        _ctx = _canvas.getContext("2d");
    }

    return {
        init:function( opts ){
            init( opts );
            boardInit();
        },
        endGame:endGame,
        usedCoords:_usedCoords,
        putChess:function( x, y ){
            putChess( x, y );
            _usedCoords.push({x:x, y:y});
            _current = _chessSwitch[_current];
        }
    }
}();