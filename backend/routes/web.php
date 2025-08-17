<?php

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage; 
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/test-qr', function () {
    Storage::disk('public')->makeDirectory('qrcodes');
    $file = "qrcodes/test.png";
    $qr = QrCode::format('png')->size(300)->generate('TEST123');
    Storage::disk('public')->put($file, $qr);
    return response()->json(['success' => true, 'file' => $file]);
});


Route::get('/', function () {
    return view('welcome');
});
